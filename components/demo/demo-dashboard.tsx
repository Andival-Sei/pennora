"use client";

import { useEffect, useState } from "react";
import { useDemo } from "./demo-provider";
import { useTranslations } from "next-intl";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer } from "@/components/layout";
import {
  Wallet,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  ArrowDown,
  ArrowUp,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency/converter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { CurrencyCode } from "@/lib/currency/rates";

// Компонент для анимированного числа
function AnimatedNumber({
  value,
  currency,
  highlight = false,
}: {
  value: number;
  currency: CurrencyCode;
  highlight?: boolean;
}) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 50, damping: 20 });

  const display = useTransform(spring, (latest) => {
    return formatCurrency(Math.round(latest), currency);
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <motion.span
      animate={highlight ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5 }}
      className={highlight ? "text-primary" : ""}
    >
      {display}
    </motion.span>
  );
}

export function DemoDashboard() {
  const t = useTranslations();
  const tDashboard = useTranslations("dashboard");
  const { accounts, transactions, categories, currency, setCurrentStep } =
    useDemo();
  const [hasRun, setHasRun] = useState(false);
  const [visibleTransactions, setVisibleTransactions] = useState<string[]>([]);
  const [highlightingCard, setHighlightingCard] = useState(false);
  const [highlightingCash, setHighlightingCash] = useState(false);
  const [highlightingIncome, setHighlightingIncome] = useState(false);
  const [highlightingExpense, setHighlightingExpense] = useState(false);

  // Текущие значения для анимации
  const [currentStats, setCurrentStats] = useState({
    totalBalance: 0,
    cardBalance: 0,
    cashBalance: 0,
    income: 0,
    expense: 0,
  });

  useEffect(() => {
    // Защита от повторного запуска
    if (hasRun || accounts.length === 0 || transactions.length === 0) return;
    setHasRun(true);

    // Начальные балансы (без транзакций)
    const initialBalance = accounts
      .filter((acc) => acc.currency === currency)
      .reduce((sum, acc) => sum + acc.balance, 0);

    const initialCard = accounts
      .filter((acc) => acc.type === "card" && acc.currency === currency)
      .reduce((sum, acc) => sum + acc.balance, 0);

    const initialCash = accounts
      .filter((acc) => acc.type === "cash" && acc.currency === currency)
      .reduce((sum, acc) => sum + acc.balance, 0);

    setCurrentStats({
      totalBalance: initialBalance,
      cardBalance: initialCard,
      cashBalance: initialCash,
      income: 0,
      expense: 0,
    });

    // Показываем изменения в реальном времени
    const runDemo = async () => {
      await delay(1500);

      // Сортируем транзакции по дате (старые сначала)
      const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Обрабатываем каждую транзакцию
      for (const transaction of sortedTransactions) {
        // 1. Добавляем транзакцию в список (появляется снизу)
        setVisibleTransactions((prev) => {
          // Проверяем, что транзакция еще не добавлена
          if (prev.includes(transaction.id)) return prev;
          return [...prev, transaction.id];
        });

        await delay(600); // Пауза, чтобы пользователь увидел транзакцию

        // 2. Обновляем статистику в зависимости от транзакции
        const account = accounts.find(
          (acc) => acc.id === transaction.account_id
        );
        if (!account) continue;

        // Подсвечиваем соответствующие карточки
        if (transaction.type === "income") {
          setHighlightingIncome(true);
          if (account.type === "card") {
            setHighlightingCard(true);
          } else if (account.type === "cash") {
            setHighlightingCash(true);
          }
        } else if (transaction.type === "expense") {
          setHighlightingExpense(true);
          if (account.type === "card") {
            setHighlightingCard(true);
          } else if (account.type === "cash") {
            setHighlightingCash(true);
          }
        }

        // Обновляем цифры
        setCurrentStats((prev) => {
          const newStats = { ...prev };

          if (transaction.type === "income") {
            newStats.income += transaction.amount;
            if (account.type === "card") {
              newStats.cardBalance += transaction.amount;
            } else if (account.type === "cash") {
              newStats.cashBalance += transaction.amount;
            }
            newStats.totalBalance += transaction.amount;
          } else if (transaction.type === "expense") {
            newStats.expense += transaction.amount;
            if (account.type === "card") {
              newStats.cardBalance -= transaction.amount;
            } else if (account.type === "cash") {
              newStats.cashBalance -= transaction.amount;
            }
            newStats.totalBalance -= transaction.amount;
          }

          return newStats;
        });

        // Убираем подсветку через 1 секунду
        await delay(1000);
        setHighlightingCard(false);
        setHighlightingCash(false);
        setHighlightingIncome(false);
        setHighlightingExpense(false);

        // Пауза перед следующей транзакцией
        await delay(800);
      }

      // Переход к финальной модалке
      await delay(2000);
      setCurrentStep("complete");
    };

    runDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, transactions, currency]);

  const visibleTransactionsList = transactions
    .filter((t) => visibleTransactions.includes(t.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen bg-background pt-20">
      <ResponsiveContainer className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            {tDashboard("title")}
          </h2>
        </motion.div>

        {/* Карточки балансов */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">
                    {tDashboard("balance.total")}
                  </div>
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold">
                  <AnimatedNumber
                    value={currentStats.totalBalance}
                    currency={currency}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <motion.div
              animate={highlightingCard ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Card
                className={`relative overflow-hidden ${highlightingCard ? "ring-2 ring-primary" : ""}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {tDashboard("balance.card")}
                    </div>
                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold">
                    <AnimatedNumber
                      value={currentStats.cardBalance}
                      currency={currency}
                      highlight={highlightingCard}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={highlightingCash ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Card
                className={`relative overflow-hidden ${highlightingCash ? "ring-2 ring-primary" : ""}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {tDashboard("balance.cash")}
                    </div>
                    <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold">
                    <AnimatedNumber
                      value={currentStats.cashBalance}
                      currency={currency}
                      highlight={highlightingCash}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={highlightingIncome ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Card
                className={`relative overflow-hidden ${highlightingIncome ? "ring-2 ring-green-500" : ""}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {tDashboard("statistics.income")}
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    +
                    <AnimatedNumber
                      value={currentStats.income}
                      currency={currency}
                      highlight={highlightingIncome}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              animate={highlightingExpense ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Card
                className={`relative overflow-hidden ${highlightingExpense ? "ring-2 ring-red-500" : ""}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {tDashboard("statistics.expense")}
                    </div>
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    -
                    <AnimatedNumber
                      value={currentStats.expense}
                      currency={currency}
                      highlight={highlightingExpense}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Итоговый баланс */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {tDashboard("statistics.netResult")}
                  </div>
                  <div className="text-2xl font-bold">
                    <AnimatedNumber
                      value={currentStats.income - currentStats.expense}
                      currency={currency}
                    />
                  </div>
                </div>
                <Wallet className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Список транзакций */}
        {visibleTransactionsList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Последние транзакции</h3>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {visibleTransactionsList.map((transaction, index) => {
                  const category = categories.find(
                    (c) => c.id === transaction.category_id
                  );
                  const isIncome = transaction.type === "income";

                  return (
                    <motion.div
                      key={`${transaction.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isIncome
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowUp className="h-5 w-5" />
                                ) : (
                                  <ArrowDown className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {transaction.description}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <span>
                                    {category?.name || "Без категории"}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {format(
                                      new Date(transaction.date),
                                      "d MMM",
                                      {
                                        locale: ru,
                                      }
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                isIncome
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {isIncome ? "+" : "-"}
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </ResponsiveContainer>
    </main>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
