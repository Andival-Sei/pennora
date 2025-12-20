import { useState, useCallback } from "react";
import { createClient } from "@/lib/db/supabase/client";
import {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionWithCategory,
} from "@/lib/types/transaction";
import { toast } from "sonner"; // Assuming sonner is used, or can switch to another toast lib

export function useTransactions() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Пользователь не авторизован");
        return [];
      }

      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          category:categories(*)
        `
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as TransactionWithCategory[];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Не удалось загрузить транзакции");
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addTransaction = async (transaction: TransactionInsert) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      toast.success("Транзакция добавлена");
      return data;
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Не удалось добавить транзакцию");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (
    id: string,
    transaction: TransactionUpdate
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(transaction)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      toast.success("Транзакция обновлена");
      return data;
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Не удалось обновить транзакцию");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Транзакция удалена");
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Не удалось удалить транзакцию");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
