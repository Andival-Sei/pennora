"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  Loader2,
  Wallet,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";

// Схемы валидации
const cardAccountSchema = z.object({
  bank: z.string().min(1, "card.bankRequired"),
  name: z.string().min(1, "card.nameRequired"),
  currency: z.enum(["RUB", "USD", "EUR"]),
  balance: z.string().refine((val) => {
    const num = parseFloat(val.replace(",", "."));
    return !isNaN(num) && num >= 0;
  }, "card.balanceInvalid"),
});

const cashAccountSchema = z.object({
  currency: z.enum(["RUB", "USD", "EUR"]),
  balance: z.string().refine((val) => {
    const num = parseFloat(val.replace(",", "."));
    return !isNaN(num) && num >= 0;
  }, "cash.balanceInvalid"),
});

type CardFormData = z.infer<typeof cardAccountSchema>;
type CashFormData = z.infer<typeof cashAccountSchema>;
type SourceType = "card" | "cash" | null;

// Список банков
const BANKS = [
  "sberbank",
  "vtb",
  "tinkoff",
  "alpha",
  "ozon",
  "yandex",
  "other",
] as const;

// Валюты
const CURRENCIES: CurrencyCode[] = ["RUB", "USD", "EUR"];

interface Account {
  id: string;
  name: string;
  type: string;
  currency: CurrencyCode;
  balance: number;
  bank?: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const t = useTranslations();
  const tAccounts = useTranslations("accounts");
  const tOnboarding = useTranslations("onboarding");
  const tCommon = useTranslations("common");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  const cardForm = useForm<CardFormData>({
    resolver: zodResolver(cardAccountSchema),
    mode: "onTouched",
    defaultValues: {
      currency: "RUB",
    },
  });

  const cashForm = useForm<CashFormData>({
    resolver: zodResolver(cashAccountSchema),
    mode: "onTouched",
    defaultValues: {
      currency: "RUB",
    },
  });

  // Определяем доступные валюты для наличных (те, которых еще нет)
  const availableCashCurrencies = useMemo(() => {
    const existingCashCurrencies = accounts
      .filter((acc) => acc.type === "cash")
      .map((acc) => acc.currency);
    return CURRENCIES.filter(
      (currency) => !existingCashCurrencies.includes(currency)
    );
  }, [accounts]);

  // Проверяем, есть ли все валюты наличных
  const hasAllCashCurrencies = useMemo(() => {
    return availableCashCurrencies.length === 0;
  }, [availableCashCurrencies]);

  // Автоматически устанавливаем тип источника при открытии диалога
  useEffect(() => {
    if (isDialogOpen) {
      if (hasAllCashCurrencies) {
        // Если все валюты наличных уже есть, автоматически выбираем карту
        setSourceType("card");
      } else {
        // Иначе сбрасываем выбор
        setSourceType(null);
      }
    } else {
      // При закрытии диалога сбрасываем формы и тип
      setSourceType(null);
      cardForm.reset();
      cashForm.reset();
    }
  }, [isDialogOpen, hasAllCashCurrencies, cardForm, cashForm]);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (accountsError) {
      setError("errors.databaseError");
    } else {
      setAccounts(
        (data || []).map((acc) => ({
          id: acc.id,
          name: acc.name,
          type: acc.type,
          currency: acc.currency as CurrencyCode,
          balance: Number(acc.balance),
        }))
      );
    }

    setLoading(false);
  }

  async function handleCardSubmit(data: CardFormData) {
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const balance = parseFloat(data.balance.replace(",", "."));

    // Формируем название счета: "Название карты (Банк)"
    const bankName = tOnboarding(`card.banks.${data.bank}`);
    const accountName =
      data.bank === "other" ? data.name : `${data.name} (${bankName})`;

    const { error: accountError } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: accountName,
      type: "card",
      currency: data.currency,
      balance: balance,
    });

    if (accountError) {
      setError("errors.databaseError");
      return;
    }

    // Закрываем диалог и обновляем список
    setIsDialogOpen(false);
    cardForm.reset();
    await loadAccounts();
  }

  async function handleCashSubmit(data: CashFormData) {
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const balance = parseFloat(data.balance.replace(",", "."));

    // Формируем название: "Наличные (Валюта)"
    const currencyName = tOnboarding(
      `currency.options.${data.currency}.name`
    );
    const accountName = `${tOnboarding("cash.defaultName")} (${currencyName})`;

    const { error: accountError } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: accountName,
      type: "cash",
      currency: data.currency,
      balance: balance,
    });

    if (accountError) {
      setError("errors.databaseError");
      return;
    }

    // Закрываем диалог и обновляем список
    setIsDialogOpen(false);
    cashForm.reset();
    await loadAccounts();
  }

  async function handleDelete(accountId: string) {
    setDeletingId(accountId);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Архивируем счёт вместо удаления
    const { error: deleteError } = await supabase
      .from("accounts")
      .update({ is_archived: true })
      .eq("id", accountId)
      .eq("user_id", user.id);

    if (deleteError) {
      setError("errors.databaseError");
      setDeletingId(null);
      return;
    }

    await loadAccounts();
    setDeletingId(null);
    setShowDeleteConfirm(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <FadeIn>
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <ResponsiveContainer className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-foreground">
                {tAccounts("title")}
              </h1>
            </div>
          </ResponsiveContainer>
        </header>
      </FadeIn>

      <ResponsiveContainer className="py-8">
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {tAccounts("title")}
              </h2>
              <p className="text-muted-foreground">
                {tAccounts("description")}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {tAccounts("addSource")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tAccounts("addSource")}</DialogTitle>
                  <DialogDescription>
                    {sourceType === "card"
                      ? tOnboarding("card.description")
                      : sourceType === "cash"
                        ? tOnboarding("cash.description")
                        : tAccounts("sourceTypePlaceholder")}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={
                    sourceType === "card"
                      ? cardForm.handleSubmit(handleCardSubmit)
                      : sourceType === "cash"
                        ? cashForm.handleSubmit(handleCashSubmit)
                        : (e) => e.preventDefault()
                  }
                  className="space-y-4"
                >
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                      >
                        {t(error)}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Выбор типа источника - показываем только если не все валюты наличных уже есть */}
                  {!hasAllCashCurrencies && sourceType === null && (
                    <div className="space-y-2">
                      <Label htmlFor="sourceType">
                        {tAccounts("sourceType")}
                      </Label>
                      <Select
                        value={sourceType || ""}
                        onValueChange={(value) =>
                          setSourceType(value as "card" | "cash")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={tAccounts("sourceTypePlaceholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">
                            {tAccounts("sourceTypeCard")}
                          </SelectItem>
                          <SelectItem value="cash">
                            {tAccounts("sourceTypeCash")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Форма карты */}
                  {sourceType === "card" && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="card-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="bank">
                            {tOnboarding("card.bankLabel")}
                          </Label>
                          <Select
                            value={cardForm.watch("bank")}
                            onValueChange={(value) =>
                              cardForm.setValue("bank", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={tOnboarding("card.bankPlaceholder")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {BANKS.map((bank) => (
                                <SelectItem key={bank} value={bank}>
                                  {tOnboarding(`card.banks.${bank}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {cardForm.formState.errors.bank && (
                            <p className="text-xs text-destructive">
                              {tOnboarding(
                                cardForm.formState.errors.bank.message as string
                              )}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">
                            {tOnboarding("card.nameLabel")}
                          </Label>
                          <Input
                            id="name"
                            {...cardForm.register("name")}
                            placeholder={tOnboarding("card.namePlaceholder")}
                            aria-invalid={!!cardForm.formState.errors.name}
                          />
                          {cardForm.formState.errors.name && (
                            <p className="text-xs text-destructive">
                              {tOnboarding(
                                cardForm.formState.errors.name
                                  .message as string
                              )}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency">
                            {tAccounts("currency")}
                          </Label>
                          <Select
                            value={cardForm.watch("currency")}
                            onValueChange={(value) =>
                              cardForm.setValue("currency", value as CurrencyCode)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {tOnboarding(
                                    `currency.options.${currency}.name`
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="balance">
                            {tOnboarding("card.balanceLabel")}
                          </Label>
                          <Input
                            id="balance"
                            type="text"
                            inputMode="decimal"
                            {...cardForm.register("balance")}
                            placeholder="0.00"
                            aria-invalid={!!cardForm.formState.errors.balance}
                          />
                          {cardForm.formState.errors.balance && (
                            <p className="text-xs text-destructive">
                              {tOnboarding(
                                cardForm.formState.errors.balance
                                  .message as string
                              )}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {/* Форма наличных */}
                  {sourceType === "cash" && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="cash-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="cashCurrency">
                            {tAccounts("currency")}
                          </Label>
                          <Select
                            value={cashForm.watch("currency")}
                            onValueChange={(value) =>
                              cashForm.setValue(
                                "currency",
                                value as CurrencyCode
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCashCurrencies.map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {tOnboarding(
                                    `currency.options.${currency}.name`
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cashBalance">
                            {tOnboarding("cash.balanceLabel")}
                          </Label>
                          <Input
                            id="cashBalance"
                            type="text"
                            inputMode="decimal"
                            {...cashForm.register("balance")}
                            placeholder="0.00"
                            aria-invalid={!!cashForm.formState.errors.balance}
                          />
                          {cashForm.formState.errors.balance && (
                            <p className="text-xs text-destructive">
                              {tOnboarding(
                                cashForm.formState.errors.balance
                                  .message as string
                              )}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {/* Кнопки действий */}
                  {(sourceType === "card" || sourceType === "cash") && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          cardForm.reset();
                          cashForm.reset();
                        }}
                      >
                        {tCommon("cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          sourceType === "card"
                            ? !cardForm.formState.isValid
                            : !cashForm.formState.isValid
                        }
                      >
                        {tAccounts("add")}
                      </Button>
                    </div>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {tAccounts("noAccounts")}
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {tAccounts("addSource")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {accounts.map((account) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {account.type === "card" ? (
                              <CreditCard className="h-5 w-5 text-primary" />
                            ) : (
                              <Wallet className="h-5 w-5 text-primary" />
                            )}
                            <CardTitle className="text-lg">
                              {account.name}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowDeleteConfirm(account.id)}
                            disabled={deletingId === account.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {deletingId === account.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <CardDescription>
                          {tOnboarding(
                            `currency.options.${account.currency}.name`
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(account.balance, account.currency)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </FadeIn>
      </ResponsiveContainer>

      {/* Окно подтверждения удаления */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() =>
                !deletingId && setShowDeleteConfirm(null)
              }
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {tAccounts("deleteTitle")}
                    </h3>
                  </div>
                  {!deletingId && (
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <p className="text-muted-foreground mb-6">
                  {tAccounts("deleteDescription")}
                </p>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={deletingId !== null}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={deletingId !== null}
                  >
                    {deletingId ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {tCommon("loading")}
                      </>
                    ) : (
                      tAccounts("deleteTitle")
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
