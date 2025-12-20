"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { revalidateDashboard } from "./actions";
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
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import {
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Wallet,
  Loader2,
  Coins,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Схемы валидации
const currencySchema = z.object({
  currency: z.enum(["RUB", "USD", "EUR"]),
});

const cardAccountSchema = z.object({
  bank: z.string().min(1, "card.bankRequired"),
  name: z.string().min(1, "card.nameRequired"),
  balance: z.string().refine((val) => {
    const num = parseFloat(val.replace(",", "."));
    return !isNaN(num) && num >= 0;
  }, "card.balanceInvalid"),
});

const cashAccountSchema = z.object({
  balance: z.string().refine((val) => {
    const num = parseFloat(val.replace(",", "."));
    return !isNaN(num) && num >= 0;
  }, "cash.balanceInvalid"),
});

type CurrencyFormData = z.infer<typeof currencySchema>;
type CardFormData = z.infer<typeof cardAccountSchema>;
type CashFormData = z.infer<typeof cashAccountSchema>;

type OnboardingStep = "currency" | "card" | "cash" | "complete";

// Валюты будут отображаться через переводы
const CURRENCY_CODES = ["RUB", "USD", "EUR"] as const;

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

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations();
  const tOnboarding = useTranslations("onboarding");
  const [step, setStep] = useState<OnboardingStep>("currency");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<
    "RUB" | "USD" | "EUR"
  >("RUB");

  const currencyForm = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    mode: "onTouched",
    defaultValues: {
      currency: "RUB",
    },
  });

  const cardForm = useForm<CardFormData>({
    resolver: zodResolver(cardAccountSchema),
    mode: "onTouched",
  });

  const cashForm = useForm<CashFormData>({
    resolver: zodResolver(cashAccountSchema),
    mode: "onTouched",
  });

  async function handleCurrencySubmit(data: CurrencyFormData) {
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

    // Обновляем валюту в профиле (и default_currency, и display_currency)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        default_currency: data.currency,
        display_currency: data.currency,
      })
      .eq("id", user.id);

    if (profileError) {
      setError("errors.databaseError");
      setLoading(false);
      return;
    }

    setSelectedCurrency(data.currency);
    setStep("card");
    setLoading(false);
  }

  async function handleCardSubmit(data: CardFormData) {
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

    const balance = parseFloat(data.balance.replace(",", "."));

    // Формируем название счета: "Название карты (Банк)"
    const bankName = tOnboarding(`card.banks.${data.bank}`);
    const accountName =
      data.bank === "other" ? data.name : `${data.name} (${bankName})`;

    const { error: accountError } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: accountName,
      type: "card",
      currency: selectedCurrency,
      balance: balance,
    });

    if (accountError) {
      setError("errors.databaseError");
      setLoading(false);
      return;
    }

    setStep("cash");
    setLoading(false);
  }

  async function handleCashSubmit(data: CashFormData) {
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

    const balance = parseFloat(data.balance.replace(",", "."));

    const { error: accountError } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: tOnboarding("cash.defaultName"),
      type: "cash",
      currency: selectedCurrency,
      balance: balance,
    });

    if (accountError) {
      setError("errors.databaseError");
      setLoading(false);
      return;
    }

    // Инвалидируем кеш dashboard перед редиректом
    await revalidateDashboard();

    // Завершение онбординга
    router.push("/dashboard");
  }

  async function handleSkip() {
    if (step === "card") {
      setStep("cash");
    } else if (step === "cash") {
      // Инвалидируем кеш dashboard перед редиректом
      await revalidateDashboard();
      router.push("/dashboard");
    }
  }

  function handleBack() {
    if (step === "card") {
      setStep("currency");
    } else if (step === "cash") {
      setStep("card");
    }
  }

  const currencyValue = useWatch({
    control: currencyForm.control,
    name: "currency",
  });

  const cardBankValue = useWatch({
    control: cardForm.control,
    name: "bank",
  });

  // Получаем символ валюты
  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      RUB: "₽",
      USD: "$",
      EUR: "€",
    };
    return symbols[code] || code;
  };

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8">
        <FadeIn>
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {tOnboarding("title")}
              </h1>
              <p className="text-muted-foreground">{tOnboarding("subtitle")}</p>
            </div>

            {/* Индикатор шагов */}
            <div className="flex justify-center gap-2 mb-8">
              <div
                className={`h-2 w-12 rounded-full transition-colors ${
                  step === "currency" ? "bg-primary" : "bg-primary/30"
                }`}
              />
              <div
                className={`h-2 w-12 rounded-full transition-colors ${
                  step === "card"
                    ? "bg-primary"
                    : step === "cash"
                      ? "bg-primary/30"
                      : "bg-muted"
                }`}
              />
              <div
                className={`h-2 w-12 rounded-full transition-colors ${
                  step === "cash" ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>

            <AnimatePresence mode="wait">
              {/* Шаг 1: Выбор валюты */}
              {step === "currency" && (
                <motion.div
                  key="currency"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Coins className="h-6 w-6 text-primary" />
                        <CardTitle>{tOnboarding("currency.title")}</CardTitle>
                      </div>
                      <CardDescription>
                        {tOnboarding("currency.description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={currencyForm.handleSubmit(
                          handleCurrencySubmit
                        )}
                        className="space-y-4"
                      >
                        {error && (
                          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                            {t(error)}
                          </div>
                        )}

                        <div className="space-y-3">
                          {CURRENCY_CODES.map((code) => (
                            <label
                              key={code}
                              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                currencyValue === code
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <input
                                type="radio"
                                value={code}
                                {...currencyForm.register("currency")}
                                className="sr-only"
                              />
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                  currencyValue === code
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {currencyValue === code && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">
                                  {tOnboarding(`currency.options.${code}.name`)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {code} {getCurrencySymbol(code)}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>

                        {currencyForm.formState.errors.currency && (
                          <p className="text-xs text-destructive">
                            {tOnboarding(
                              currencyForm.formState.errors.currency
                                .message as string
                            )}
                          </p>
                        )}

                        <Button
                          type="submit"
                          disabled={loading || !currencyForm.formState.isValid}
                          className="w-full"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-2" />
                          )}
                          {t("common.next")}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Шаг 2: Дебетовая карта */}
              {step === "card" && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <CardTitle>{tOnboarding("card.title")}</CardTitle>
                      </div>
                      <CardDescription>
                        {tOnboarding("card.description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={cardForm.handleSubmit(handleCardSubmit)}
                        className="space-y-4"
                      >
                        {error && (
                          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                            {t(error)}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="bank">
                            {tOnboarding("card.bankLabel")}
                          </Label>
                          <Select
                            value={cardBankValue || ""}
                            onValueChange={(value) =>
                              cardForm.setValue("bank", value, {
                                shouldValidate: true,
                              })
                            }
                          >
                            <SelectTrigger
                              id="bank"
                              aria-invalid={!!cardForm.formState.errors.bank}
                            >
                              <SelectValue
                                placeholder={tOnboarding(
                                  "card.bankPlaceholder"
                                )}
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
                          <Label htmlFor="cardName">
                            {tOnboarding("card.nameLabel")}
                          </Label>
                          <Input
                            id="cardName"
                            placeholder={tOnboarding("card.namePlaceholder")}
                            {...cardForm.register("name")}
                          />
                          {cardForm.formState.errors.name && (
                            <p className="text-xs text-destructive">
                              {tOnboarding(
                                cardForm.formState.errors.name.message as string
                              )}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardBalance">
                            {tOnboarding("card.balanceLabel")} (
                            {getCurrencySymbol(selectedCurrency)})
                          </Label>
                          <Input
                            id="cardBalance"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            {...cardForm.register("balance")}
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

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={loading}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t("common.back")}
                          </Button>
                          <Button
                            type="submit"
                            disabled={loading || !cardForm.formState.isValid}
                            className="flex-1"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            {t("common.next")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkip}
                            disabled={loading}
                          >
                            {t("common.skip")}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Шаг 3: Наличные */}
              {step === "cash" && (
                <motion.div
                  key="cash"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Wallet className="h-6 w-6 text-primary" />
                        <CardTitle>{tOnboarding("cash.title")}</CardTitle>
                      </div>
                      <CardDescription>
                        {tOnboarding("cash.description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={cashForm.handleSubmit(handleCashSubmit)}
                        className="space-y-4"
                      >
                        {error && (
                          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                            {t(error)}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="cashBalance">
                            {tOnboarding("cash.balanceLabel")} (
                            {getCurrencySymbol(selectedCurrency)})
                          </Label>
                          <Input
                            id="cashBalance"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            {...cashForm.register("balance")}
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

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={loading}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t("common.back")}
                          </Button>
                          <Button
                            type="submit"
                            disabled={loading || !cashForm.formState.isValid}
                            className="flex-1"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {tOnboarding("finish")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkip}
                            disabled={loading}
                          >
                            {t("common.skip")}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
