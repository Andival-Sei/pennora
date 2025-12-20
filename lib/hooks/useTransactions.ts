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

  const fetchTransactions = useCallback(
    async (filters?: { month?: number; year?: number }) => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Пользователь не авторизован");
          return [];
        }

        let query = supabase
          .from("transactions")
          .select(
            `
          *,
          category:categories(*)
        `
          )
          .eq("user_id", user.id);

        // Применяем фильтр по месяцу и году, если они указаны
        if (filters?.month !== undefined && filters?.year !== undefined) {
          const startDate = new Date(filters.year, filters.month, 1);
          const endDate = new Date(
            filters.year,
            filters.month + 1,
            0,
            23,
            59,
            59
          );
          query = query
            .gte("date", startDate.toISOString())
            .lte("date", endDate.toISOString());
        }

        const { data, error } = await query.order("date", { ascending: false });

        if (error) throw error;
        return data as TransactionWithCategory[];
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Не удалось загрузить транзакции");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

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

  const getAvailableMonthsAndYears = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { months: [], years: [] };
      }

      // Получаем все транзакции пользователя
      const { data, error } = await supabase
        .from("transactions")
        .select("date")
        .eq("user_id", user.id);

      if (error) throw error;

      // Извлекаем уникальные месяцы и годы
      const monthYearSet = new Set<string>();
      const yearSet = new Set<number>();

      data?.forEach((transaction) => {
        const date = new Date(transaction.date);
        const year = date.getFullYear();
        const month = date.getMonth();
        monthYearSet.add(`${year}-${month}`);
        yearSet.add(year);
      });

      // Преобразуем в массивы и сортируем
      const months: Array<{ month: number; year: number }> = Array.from(
        monthYearSet
      )
        .map((item) => {
          const [year, month] = item.split("-").map(Number);
          return { month, year };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });

      const years = Array.from(yearSet).sort((a, b) => b - a);

      return { months, years };
    } catch (error) {
      console.error("Error fetching available months/years:", error);
      return { months: [], years: [] };
    }
  }, [supabase]);

  return {
    loading,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getAvailableMonthsAndYears,
  };
}
