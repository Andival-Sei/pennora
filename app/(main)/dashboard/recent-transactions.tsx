"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Loader2, ChevronDown, Package } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { memo, useCallback, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";
import { motion, AnimatePresence } from "framer-motion";
import { queryKeys } from "@/lib/query/keys";
import { fetchTransactions } from "@/lib/query/queries/transactions";
import { fetchAccounts } from "@/lib/query/queries/accounts";
import { formatCurrency } from "@/lib/currency/formatter";
import { cn } from "@/lib/utils";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import type { TransactionWithItems } from "@/lib/types/transaction";

// Маппинг иконок категорий
const defaultIcons: Record<string, keyof typeof LucideIcons> = {
  home: "Home",
  shopping: "ShoppingCart",
  car: "Car",
  food: "UtensilsCrossed",
  heart: "Heart",
  gift: "Gift",
  wallet: "Wallet",
  coffee: "Coffee",
  plane: "Plane",
  gamepad: "Gamepad2",
  book: "Book",
  music: "Music",
  film: "Film",
  briefcase: "Briefcase",
  dollar: "DollarSign",
  trending: "TrendingUp",
};

// Компонент для рендеринга иконки категории - объявлен вне render-функций
const CategoryIcon = memo(function CategoryIcon({
  iconKey,
  className,
}: {
  iconKey: string | null;
  className?: string;
}) {
  if (!iconKey) return null;
  const IconComponent = LucideIcons[
    defaultIcons[iconKey] as keyof typeof LucideIcons
  ] as React.ComponentType<{ className?: string }> | undefined;
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
});

// Мемоизированный компонент для элемента транзакции
interface RecentTransactionItemProps {
  transaction: TransactionWithItems;
  getAccountName: (accountId: string | null) => string;
  tTransactions: (key: string) => string;
}

const RecentTransactionItem = memo(function RecentTransactionItem({
  transaction,
  getAccountName,
  tTransactions,
}: RecentTransactionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const iconKey = transaction.category?.icon ?? null;
  const hasItems = transaction.items && transaction.items.length > 1;

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {transaction.type === "transfer" ? (
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              {hasItems ? (
                <Package className="h-4 w-4 text-muted-foreground" />
              ) : iconKey ? (
                <CategoryIcon
                  iconKey={iconKey}
                  className="h-4 w-4 text-muted-foreground"
                />
              ) : (
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {transaction.type === "transfer" ? (
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                {tTransactions("list.transferFrom")}{" "}
                {getAccountName(transaction.account_id)} →{" "}
                {getAccountName(transaction.to_account_id)}
              </p>
            ) : hasItems ? (
              <button
                type="button"
                onClick={handleToggleExpand}
                className="text-left hover:opacity-80 transition-opacity w-full"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {transaction.items!.length} {tTransactions("items.title")}
                  </span>
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </motion.span>
                </div>
              </button>
            ) : (
              <p className="text-sm font-medium truncate">
                {transaction.category?.name || tTransactions("uncategorized")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {format(new Date(transaction.date), "dd.MM.yyyy")}
            </p>
          </div>
        </div>
        <div className="shrink-0 ml-4">
          <span
            className={cn(
              "text-sm font-semibold whitespace-nowrap",
              transaction.type === "income"
                ? "text-emerald-600 dark:text-emerald-400"
                : transaction.type === "expense"
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
            )}
          >
            {transaction.type === "transfer"
              ? ""
              : transaction.type === "income"
                ? "+"
                : "-"}
            {formatCurrency(transaction.amount, transaction.currency)}
          </span>
        </div>
      </div>
      {/* Раскрывающийся список позиций */}
      <AnimatePresence>
        {hasItems && isExpanded && transaction.items && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pb-2 pl-11 space-y-1.5"
          >
            {transaction.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon
                    iconKey={item.category?.icon ?? null}
                    className="h-3 w-3 text-muted-foreground"
                  />
                  <span className="text-muted-foreground">
                    {item.category?.name || tTransactions("uncategorized")}
                  </span>
                </div>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  -{formatCurrency(item.amount, transaction.currency)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const RecentTransactions = memo(function RecentTransactions() {
  const t = useTranslations("dashboard");
  const tTransactions = useTranslations("transactions");

  // Загружаем последние 5 транзакций
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: queryKeys.transactions.list(),
    queryFn: () => fetchTransactions(),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
    select: (data: TransactionWithItems[]) => data.slice(0, 5), // Берем только первые 5
  });

  // Загружаем счета для отображения названий
  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: fetchAccounts,
    staleTime: QUERY_STALE_TIME.ACCOUNTS,
    gcTime: QUERY_GC_TIME.ACCOUNTS,
  });

  const getAccountName = useCallback(
    (accountId: string | null) => {
      if (!accountId) return "";
      const account = accounts.find((acc) => acc.id === accountId);
      return account?.name || "";
    },
    [accounts]
  );

  if (isLoading) {
    return (
      <FadeIn delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle>{t("recentTransactions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  if (transactions.length === 0) {
    return (
      <FadeIn delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle>{t("recentTransactions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">{t("recentTransactions.empty")}</p>
              <Link href="/dashboard/transactions">
                <Button variant="outline" size="sm">
                  {t("recentTransactions.addFirst")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.3}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{t("recentTransactions.title")}</CardTitle>
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm">
              {t("recentTransactions.viewAll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <RecentTransactionItem
                key={transaction.id}
                transaction={transaction}
                getAccountName={getAccountName}
                tTransactions={tTransactions}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
});
