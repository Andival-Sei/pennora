"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import * as LucideIcons from "lucide-react";

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
import { TransactionWithCategory } from "@/lib/types/transaction";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";
import { formatCurrency } from "@/lib/currency/formatter";

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

// Функция для получения компонента иконки
function getCategoryIcon(iconKey: string | null) {
  if (!iconKey) return null;
  const IconName = defaultIcons[iconKey] || iconKey;
  const IconComponent = LucideIcons[
    IconName as keyof typeof LucideIcons
  ] as React.ComponentType<{ className?: string }>;
  return IconComponent || null;
}

interface TransactionListProps {
  monthFilter?: { month: number; year: number };
}

export function TransactionList({ monthFilter }: TransactionListProps) {
  const t = useTranslations("transactions");
  const { deleteTransaction } = useTransactions();
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithCategory | null>(null);

  // Используем React Query напрямую для загрузки транзакций
  const filters = monthFilter
    ? { month: monthFilter.month, year: monthFilter.year }
    : undefined;

  const { data: transactions = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 15 * 60 * 1000, // 15 минут
  });

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteConfirm"))) {
      await deleteTransaction(id);
      // React Query автоматически обновит данные после мутации
    }
  };

  if (loading) {
    return <div className="text-center py-4">{t("loading")}</div>;
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
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.date), "dd.MM.yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = transaction.category?.icon
                        ? getCategoryIcon(transaction.category.icon)
                        : null;
                      return IconComponent ? (
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                      ) : null;
                    })()}
                    <span>
                      {transaction.category?.name || t("uncategorized")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    transaction.type === "income"
                      ? "text-green-600"
                      : transaction.type === "expense"
                        ? "text-red-600"
                        : "text-blue-600"
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
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
                      <DropdownMenuItem
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Мобильная версия - карточки */}
      <div className="md:hidden space-y-3">
        {transactions.map((transaction) => {
          const IconComponent = transaction.category?.icon
            ? getCategoryIcon(transaction.category.icon)
            : null;
          return (
            <div
              key={transaction.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">
                      {transaction.category?.name || t("uncategorized")}
                    </span>
                  </div>
                  {transaction.description && (
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
                      "font-semibold text-lg",
                      transaction.type === "income"
                        ? "text-green-600"
                        : transaction.type === "expense"
                          ? "text-red-600"
                          : "text-blue-600"
                    )}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <DialogContent>
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
    </>
  );
}
