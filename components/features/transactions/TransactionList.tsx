"use client";

import { useState, useCallback, memo } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Edit2, Trash2, MoreVertical, X, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { ArrowRight } from "lucide-react";

// Маппинг иконок категорий (как в CategoryItem)
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

// Мемоизированный компонент для строки таблицы (десктоп)
interface TransactionRowProps {
  transaction: TransactionWithItems;
  getAccountName: (accountId: string | null) => string;
  onEdit: (transaction: TransactionWithItems) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

const TransactionRow = memo(function TransactionRow({
  transaction,
  getAccountName,
  onEdit,
  onDelete,
  t,
}: TransactionRowProps) {
  const iconKey = transaction.category?.icon ?? null;
  const hasItems = transaction.items && transaction.items.length > 1;

  const handleEdit = useCallback(() => {
    onEdit(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDelete(transaction.id);
  }, [onDelete, transaction.id]);

  return (
    <TableRow>
      <TableCell>{format(new Date(transaction.date), "dd.MM.yyyy")}</TableCell>
      <TableCell>
        {transaction.type === "transfer" ? (
          <div className="flex items-center gap-2 text-blue-600">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm">
              {t("list.transferFrom")} {getAccountName(transaction.account_id)}{" "}
              → {t("list.transferTo")}{" "}
              {getAccountName(transaction.to_account_id)}
            </span>
          </div>
        ) : hasItems ? (
          // Отображаем количество позиций для split transactions
          <div className="flex items-center gap-2">
            <LucideIcons.Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {transaction.items!.length} {t("items.title")}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CategoryIcon
              iconKey={iconKey}
              className="h-4 w-4 text-muted-foreground"
            />
            <span>{transaction.category?.name || t("uncategorized")}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        {transaction.description ||
          (transaction.type === "transfer" ? "" : null)}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-medium whitespace-nowrap",
          transaction.type === "income"
            ? "text-green-600"
            : transaction.type === "expense"
              ? "text-red-600"
              : "text-blue-600"
        )}
      >
        {transaction.type === "transfer"
          ? ""
          : transaction.type === "income"
            ? "+"
            : "-"}
        {formatCurrency(transaction.amount, transaction.currency)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
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
      </TableCell>
    </TableRow>
  );
});

// Мемоизированный компонент для карточки (мобильная версия)
interface TransactionCardProps {
  transaction: TransactionWithItems;
  getAccountName: (accountId: string | null) => string;
  onEdit: (transaction: TransactionWithItems) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

const TransactionCard = memo(function TransactionCard({
  transaction,
  getAccountName,
  onEdit,
  onDelete,
  t,
}: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const iconKey = transaction.category?.icon ?? null;
  const hasItems = transaction.items && transaction.items.length > 1;

  const handleEdit = useCallback(() => {
    onEdit(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDelete(transaction.id);
  }, [onDelete, transaction.id]);

  return (
    <div
      key={transaction.id}
      className="rounded-lg border bg-card p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {transaction.type === "transfer" ? (
            <div className="flex items-center gap-2 text-blue-600">
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium text-sm">
                {t("list.transferFrom")}{" "}
                {getAccountName(transaction.account_id)} →{" "}
                {t("list.transferTo")}{" "}
                {getAccountName(transaction.to_account_id)}
              </span>
            </div>
          ) : hasItems ? (
            // Отображаем количество позиций для split transactions
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
            >
              <LucideIcons.Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {transaction.items!.length} {t("items.title")}
              </span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <LucideIcons.ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <CategoryIcon
                iconKey={iconKey}
                className="h-4 w-4 text-muted-foreground"
              />
              <span className="font-medium">
                {transaction.category?.name || t("uncategorized")}
              </span>
            </div>
          )}
          {transaction.description && transaction.type !== "transfer" && (
            <p className="text-sm text-muted-foreground">
              {transaction.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {format(new Date(transaction.date), "dd.MM.yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-semibold text-lg whitespace-nowrap",
              transaction.type === "income"
                ? "text-green-600"
                : transaction.type === "expense"
                  ? "text-red-600"
                  : "text-blue-600"
            )}
          >
            {transaction.type === "transfer"
              ? ""
              : transaction.type === "income"
                ? "+"
                : "-"}
            {formatCurrency(transaction.amount, transaction.currency)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
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

      {/* Раскрывающийся список позиций */}
      <AnimatePresence>
        {hasItems && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t pt-3 mt-2 space-y-2"
          >
            {transaction.items!.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon
                    iconKey={item.category?.icon ?? null}
                    className="h-3 w-3 text-muted-foreground"
                  />
                  <span className="text-muted-foreground">
                    {item.description ||
                      item.category?.name ||
                      t("uncategorized")}
                  </span>
                </div>
                <span className="text-red-600 font-medium">
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

  // Используем React Query напрямую для загрузки транзакций
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

  // Функция для получения названия счета по ID (мемоизируем)
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
        // React Query автоматически обновит данные после мутации
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTransaction]
  );

  // Мемоизируем обработчики для редактирования и удаления
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
      <div className="text-center py-4 text-muted-foreground">
        {t("noTransactions")}
      </div>
    );
  }

  return (
    <>
      {/* Десктопная версия - таблица */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("list.date")}</TableHead>
              <TableHead>{t("list.category")}</TableHead>
              <TableHead>{t("list.description")}</TableHead>
              <TableHead className="text-right">{t("list.amount")}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                getAccountName={getAccountName}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                t={t}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Мобильная версия - карточки */}
      <div className="md:hidden space-y-3">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            getAccountName={getAccountName}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            t={t}
          />
        ))}
      </div>

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
              initialData={editingTransaction}
              onSuccess={() => {
                setEditingTransaction(null);
                // React Query автоматически обновит данные после мутации
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {deletingTransactionId && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !isDeleting && setDeletingTransactionId(null)}
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
