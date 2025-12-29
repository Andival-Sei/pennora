"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Loader2, ChevronDown, Package } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";
import { queryKeys } from "@/lib/query/keys";
import { fetchRecentTransactions } from "@/lib/query/queries/transactions";
import { fetchAccounts } from "@/lib/query/queries/accounts";
import { formatCurrency } from "@/lib/currency/formatter";
import { cn } from "@/lib/utils";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import type { TransactionWithItems } from "@/lib/types/transaction";
import { formatDate } from "@/lib/utils/date";

// Маппинг иконок категорий (полный список, синхронизирован с CategoryItem.tsx)
const defaultIcons: Record<string, keyof typeof LucideIcons> = {
  // Основные категории
  home: "Home",
  shopping: "ShoppingCart",
  "shopping-bag": "ShoppingBag",
  car: "Car",
  "car-front": "CarFront",
  food: "UtensilsCrossed",
  utensils: "Utensils",
  heart: "Heart",
  "heart-pulse": "HeartPulse",
  gift: "Gift",
  wallet: "Wallet",
  "credit-card": "CreditCard",
  banknote: "Banknote",
  coffee: "Coffee",
  dollar: "DollarSign",
  trending: "TrendingUp",
  "trending-down": "TrendingDown",

  // Транспорт
  plane: "Plane",
  train: "Train",
  bike: "Bike",
  bus: "Bus",
  fuel: "Fuel",

  // Развлечения и хобби
  gamepad: "Gamepad2",
  music: "Music",
  film: "Film",
  camera: "Camera",
  palette: "Palette",
  dumbbell: "Dumbbell",
  trophy: "Trophy",

  // Образование и работа
  book: "Book",
  "graduation-cap": "GraduationCap",
  school: "School",
  briefcase: "Briefcase",
  building: "Building",
  "file-text": "FileText",
  calculator: "Calculator",

  // Здоровье и красота
  stethoscope: "Stethoscope",
  pill: "Pill",
  scissors: "Scissors",
  sparkles: "Sparkles",

  // Семья и домашние животные
  baby: "Baby",
  dog: "Dog",
  cat: "Cat",

  // Технологии и связь
  smartphone: "Smartphone",
  laptop: "Laptop",
  wifi: "Wifi",
  phone: "Phone",
  mail: "Mail",

  // Прочее
  tag: "Tag",
  star: "Star",
  bell: "Bell",
  calendar: "Calendar",
  clock: "Clock",
  "map-pin": "MapPin",
  package: "Package",
  box: "Box",
  receipt: "Receipt",
  store: "Store",
  zap: "Zap",
  droplet: "Droplet",
  flame: "Flame",
  "tree-pine": "TreePine",
  shirt: "Shirt",
  footprints: "Footprints",
  umbrella: "Umbrella",
  sun: "Sun",
  moon: "Moon",
};

// Компонент для рендеринга иконки категории
const CategoryIcon = memo(function CategoryIcon({
  iconKey,
  className,
}: {
  iconKey: string | null;
  className?: string;
}) {
  if (!iconKey) return null;
  const IconName = defaultIcons[iconKey] || iconKey;
  const IconComponent =
    (LucideIcons[IconName as keyof typeof LucideIcons] as
      | React.ComponentType<{ className?: string }>
      | undefined) || LucideIcons.Folder;
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

  // Определение цвета и знака для суммы
  const amountColor =
    transaction.type === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : transaction.type === "expense"
        ? "text-red-600 dark:text-red-400"
        : "text-blue-600 dark:text-blue-400";

  const amountSign =
    transaction.type === "transfer"
      ? ""
      : transaction.type === "income"
        ? "+"
        : "-";

  return (
    <div className="group">
      <div className="flex items-center gap-3 py-2.5 hover:bg-muted/50 transition-colors rounded-lg -mx-2 px-2">
        {/* Иконка */}
        <div
          className={cn(
            "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
            transaction.type === "transfer"
              ? "bg-blue-100 dark:bg-blue-900/30"
              : transaction.type === "income"
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-muted"
          )}
        >
          {transaction.type === "transfer" ? (
            <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : hasItems ? (
            <Package className="h-4 w-4 text-muted-foreground" />
          ) : iconKey ? (
            <CategoryIcon
              iconKey={iconKey}
              className={cn(
                "h-4 w-4",
                transaction.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
            />
          ) : (
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
          )}
        </div>

        {/* Основная информация */}
        <div className="flex-1 min-w-0">
          {transaction.type === "transfer" ? (
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
              {getAccountName(transaction.account_id)} →{" "}
              {getAccountName(transaction.to_account_id)}
            </p>
          ) : hasItems ? (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="text-left hover:opacity-80 transition-opacity w-full flex items-center gap-1.5"
            >
              <span className="text-sm font-medium">
                {transaction.items!.length} {tTransactions("items.title")}
              </span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.span>
            </button>
          ) : (
            <p className="text-sm font-medium truncate">
              {transaction.category?.name || tTransactions("uncategorized")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.date, "d MMM")}
          </p>
        </div>

        {/* Сумма */}
        <div className="shrink-0">
          <span className={cn("text-sm font-semibold", amountColor)}>
            {amountSign}
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
            className="ml-12 pl-3 border-l-2 border-muted mb-1"
          >
            <div className="space-y-1 py-1.5">
              {transaction.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CategoryIcon
                      iconKey={item.category?.icon ?? null}
                      className="h-3 w-3 text-muted-foreground shrink-0"
                    />
                    <span className="text-muted-foreground truncate">
                      {item.category?.name || tTransactions("uncategorized")}
                    </span>
                  </div>
                  <span className="text-red-600 dark:text-red-400 font-medium shrink-0 ml-2">
                    -{formatCurrency(item.amount, transaction.currency)}
                  </span>
                </div>
              ))}
            </div>
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
    queryKey: queryKeys.transactions.recent(5),
    queryFn: () => fetchRecentTransactions(5),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
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
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t("recentTransactions.empty")}
              </p>
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
            <Button variant="ghost" size="sm" className="gap-1.5">
              {t("recentTransactions.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/50">
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
