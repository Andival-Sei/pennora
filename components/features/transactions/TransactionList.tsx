"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Loader2,
  ChevronDown,
  ArrowRight,
  Package,
  Calendar,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { queryKeys } from "@/lib/query/keys";
import { fetchTransactions } from "@/lib/query/queries/transactions";
import { fetchAccounts } from "@/lib/query/queries/accounts";
import type { TransactionWithItems } from "@/lib/types/transaction";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";
import { formatCurrency } from "@/lib/currency/formatter";
import { groupByDate } from "@/lib/utils/date";

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
  const IconComponent = LucideIcons[IconName as keyof typeof LucideIcons] as
    | React.ComponentType<{ className?: string }>
    | undefined;
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
});

interface TransactionListProps {
  monthFilter?: { month: number; year: number };
}

// Компонент элемента транзакции (общий для desktop и mobile)
interface TransactionItemProps {
  transaction: TransactionWithItems;
  getAccountName: (accountId: string | null) => string;
  onEdit: (transaction: TransactionWithItems) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

const TransactionItem = memo(function TransactionItem({
  transaction,
  getAccountName,
  onEdit,
  onDelete,
  t,
}: TransactionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const iconKey = transaction.category?.icon ?? null;
  const hasItems = transaction.items && transaction.items.length > 1;

  const handleEdit = useCallback(() => {
    onEdit(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDelete(transaction.id);
  }, [onDelete, transaction.id]);

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
      <div className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors rounded-lg -mx-4">
        {/* Иконка */}
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            transaction.type === "transfer"
              ? "bg-blue-100 dark:bg-blue-900/30"
              : transaction.type === "income"
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-muted"
          )}
        >
          {transaction.type === "transfer" ? (
            <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          ) : hasItems ? (
            <Package className="h-5 w-5 text-muted-foreground" />
          ) : iconKey ? (
            <CategoryIcon
              iconKey={iconKey}
              className={cn(
                "h-5 w-5",
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
              className="text-left hover:opacity-80 transition-opacity w-full flex items-center gap-2"
            >
              <span className="text-sm font-medium">
                {transaction.items!.length} {t("items.title")}
              </span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.span>
            </button>
          ) : (
            <p className="text-sm font-medium truncate">
              {transaction.category?.name || t("uncategorized")}
            </p>
          )}
          {transaction.description && transaction.type !== "transfer" && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {transaction.description}
            </p>
          )}
        </div>

        {/* Сумма */}
        <div className="shrink-0 text-right">
          <span className={cn("text-sm font-semibold", amountColor)}>
            {amountSign}
            {formatCurrency(transaction.amount, transaction.currency)}
          </span>
        </div>

        {/* Действия */}
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                {t("actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Раскрывающиеся позиции для split transactions */}
      <AnimatePresence>
        {hasItems && isExpanded && transaction.items && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-[52px] mb-2 pl-4 border-l-2 border-muted"
          >
            <div className="space-y-1 py-2">
              {transaction.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryIcon
                      iconKey={item.category?.icon ?? null}
                      className="h-4 w-4 text-muted-foreground shrink-0"
                    />
                    <span className="text-muted-foreground truncate">
                      {item.category?.name || t("uncategorized")}
                    </span>
                    {item.description && (
                      <span className="text-muted-foreground/60 truncate text-xs">
                        · {item.description}
                      </span>
                    )}
                  </div>
                  <span className="text-red-600 dark:text-red-400 font-medium shrink-0 ml-4">
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

// Компонент заголовка даты
const DateHeader = memo(function DateHeader({ date }: { date: string }) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 px-4 -mx-4 border-b">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          {date}
        </span>
      </div>
    </div>
  );
});

export const TransactionList = memo(function TransactionList({
  monthFilter,
}: TransactionListProps) {
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");
  const { deleteTransaction } = useTransactions();
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithItems | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Используем React Query для загрузки транзакций
  const filters = monthFilter
    ? { month: monthFilter.month, year: monthFilter.year }
    : undefined;

  const {
    data: transactions = [],
    isLoading: loading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: QUERY_STALE_TIME.TRANSACTIONS,
    gcTime: QUERY_GC_TIME.TRANSACTIONS,
  });

  // Загружаем счета для отображения названий в переводах
  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: fetchAccounts,
    staleTime: QUERY_STALE_TIME.ACCOUNTS,
    gcTime: QUERY_GC_TIME.ACCOUNTS,
  });

  // Группируем транзакции по дате
  const groupedTransactions = useMemo(() => {
    return groupByDate(transactions, "ru");
  }, [transactions]);

  // Функция для получения названия счета по ID
  const getAccountName = useCallback(
    (accountId: string | null) => {
      if (!accountId) return "";
      const account = accounts.find((acc) => acc.id === accountId);
      return account?.name || "";
    },
    [accounts]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await deleteTransaction(id);
        setDeletingTransactionId(null);
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTransaction]
  );

  const handleEditTransaction = useCallback(
    (transaction: TransactionWithItems) => {
      setEditingTransaction(transaction);
    },
    []
  );

  const handleDeleteTransaction = useCallback((id: string) => {
    setDeletingTransactionId(id);
  }, []);

  if (loading) {
    return <LoadingState message={t("loading")} />;
  }

  if (transactionsError) {
    return (
      <ErrorState
        error={transactionsError}
        onRetry={() => refetchTransactions()}
      />
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{t("noTransactions")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Список транзакций сгруппированный по датам */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="divide-y">
          {Array.from(groupedTransactions.entries()).map(
            ([dateKey, dateTransactions]) => (
              <div key={dateKey} className="px-4">
                <DateHeader date={dateKey} />
                <div className="divide-y divide-border/50">
                  {dateTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      getAccountName={getAccountName}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Диалог редактирования */}
      <Dialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              key={editingTransaction.id}
              initialData={editingTransaction}
              onSuccess={() => {
                setEditingTransaction(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Модальное окно подтверждения удаления */}
      <AnimatePresence>
        {deletingTransactionId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !isDeleting && setDeletingTransactionId(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-2xl shadow-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("actions.delete")}
                    </h3>
                  </div>
                  {!isDeleting && (
                    <button
                      onClick={() => setDeletingTransactionId(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground mb-6">
                  {t("deleteConfirm")}
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingTransactionId(null)}
                    disabled={isDeleting}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      deletingTransactionId &&
                      handleDelete(deletingTransactionId)
                    }
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {tCommon("loading")}
                      </>
                    ) : (
                      t("actions.delete")
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
