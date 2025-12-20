"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { Edit2, Trash2, MoreVertical } from "lucide-react";

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
import { TransactionWithCategory } from "@/lib/types/transaction";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";

export function TransactionList() {
  const t = useTranslations("transactions");
  const locale = useLocale();
  const { fetchTransactions, deleteTransaction } = useTransactions();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithCategory | null>(null);

  const loadData = useCallback(async () => {
    const data = await fetchTransactions();
    setTransactions(data);
    setLoading(false);
  }, [fetchTransactions]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData();
    })();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteConfirm"))) {
      const success = await deleteTransaction(id);
      if (success) {
        loadData();
      }
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
      <div className="rounded-md border">
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
                    {transaction.category?.icon && (
                      <span className="text-lg">
                        {transaction.category.icon}
                      </span>
                    )}
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
                  {new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
                    style: "currency",
                    currency: transaction.currency,
                  }).format(transaction.amount)}
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
                loadData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
