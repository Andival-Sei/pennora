"use client";

import { useEffect, useState } from "react";
import { useDemo } from "./demo-provider";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveContainer } from "@/components/layout";
import { Coins, CreditCard, Wallet, Check, ArrowRight } from "lucide-react";
import type { CurrencyCode } from "@/lib/currency/rates";

const CURRENCY_CODES: CurrencyCode[] = ["RUB", "USD", "EUR"];

type OnboardingStep = "currency" | "card" | "cash";

export function DemoOnboarding() {
  const tOnboarding = useTranslations("onboarding");
  const {
    currency,
    setCurrency,
    setCurrentStep,
    addAccount,
    addCategory,
    addTransaction,
  } = useDemo();
  const [step, setStep] = useState<OnboardingStep>("currency");
  const [, setIsAnimating] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    // Защита от повторного запуска
    if (hasRun) return;
    setHasRun(true);

    // Автоматически проходим через онбординг
    const runOnboarding = async () => {
      // Шаг 1: Выбор валюты (2 секунды)
      await delay(2000);
      setCurrency("RUB");
      setIsAnimating(true);
      await delay(500);
      setStep("card");
      setIsAnimating(false);

      // Шаг 2: Добавление карты (3 секунды)
      await delay(3000);
      setIsAnimating(true);
      await delay(500);
      const cardAccountId = "demo-account-1";
      addAccount({
        id: cardAccountId,
        name: "Основная карта (Сбербанк)",
        type: "card",
        currency: "RUB",
        balance: 50000,
        bank: "sberbank",
      });
      setStep("cash");
      setIsAnimating(false);

      // Шаг 3: Добавление наличных (1.5 секунды)
      await delay(1500);
      setIsAnimating(true);
      await delay(500);
      addAccount({
        id: "demo-account-2",
        name: "Наличные (RUB)",
        type: "cash",
        currency: "RUB",
        balance: 5000,
      });
      setIsAnimating(false);

      // Добавляем категории и транзакции для демо дашборда
      await delay(1000);

      // Категории
      const categories = [
        {
          id: "demo-cat-1",
          name: "Продукты",
          type: "expense" as const,
          color: "#10b981",
        },
        {
          id: "demo-cat-2",
          name: "Транспорт",
          type: "expense" as const,
          color: "#3b82f6",
        },
        {
          id: "demo-cat-3",
          name: "Зарплата",
          type: "income" as const,
          color: "#f59e0b",
        },
      ];

      categories.forEach((cat) => {
        addCategory(cat);
      });

      await delay(1000);

      // Транзакции
      addTransaction({
        id: "demo-trans-1",
        account_id: cardAccountId,
        category_id: categories[2].id, // Зарплата
        type: "income",
        amount: 100000,
        currency: "RUB",
        description: "Зарплата",
        date: new Date().toISOString(),
      });

      addTransaction({
        id: "demo-trans-2",
        account_id: cardAccountId,
        category_id: categories[0].id, // Продукты
        type: "expense",
        amount: 1500,
        currency: "RUB",
        description: "Продукты в магазине",
        date: new Date().toISOString(),
      });

      addTransaction({
        id: "demo-trans-3",
        account_id: cardAccountId,
        category_id: categories[1].id, // Транспорт
        type: "expense",
        amount: 500,
        currency: "RUB",
        description: "Проезд на метро",
        date: new Date().toISOString(),
      });

      // Переход к дашборду
      await delay(2000);
      setCurrentStep("dashboard");
    };

    runOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      RUB: "₽",
      USD: "$",
      EUR: "€",
    };
    return symbols[code] || code;
  };

  return (
    <main className="min-h-screen bg-background pt-20">
      <ResponsiveContainer className="py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{tOnboarding("title")}</h1>
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
                    <div className="space-y-3">
                      {CURRENCY_CODES.map((code) => (
                        <motion.label
                          key={code}
                          className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            currency === code
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          animate={
                            currency === code ? { scale: 1.02 } : { scale: 1 }
                          }
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              currency === code
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {currency === code && (
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
                        </motion.label>
                      ))}
                    </div>
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
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-primary/50 bg-primary/5 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">
                          {tOnboarding("card.bankLabel")}
                        </div>
                        <div className="font-medium">
                          {tOnboarding("card.banks.sberbank")}
                        </div>
                      </div>
                      <div className="p-4 border-2 border-primary/50 bg-primary/5 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">
                          {tOnboarding("card.nameLabel")}
                        </div>
                        <div className="font-medium">Основная карта</div>
                      </div>
                      <div className="p-4 border-2 border-primary/50 bg-primary/5 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">
                          {tOnboarding("card.balanceLabel")}
                        </div>
                        <div className="font-medium">50 000 ₽</div>
                      </div>
                      <motion.div
                        className="flex items-center justify-end"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </motion.div>
                    </div>
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
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-primary/50 bg-primary/5 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">
                          {tOnboarding("cash.balanceLabel")}
                        </div>
                        <div className="font-medium">5 000 ₽</div>
                      </div>
                      <motion.div
                        className="flex items-center justify-center gap-2 text-primary"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {tOnboarding("finish")}
                        </span>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ResponsiveContainer>
    </main>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
