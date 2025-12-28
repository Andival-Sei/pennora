"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/db/supabase/client";
import { getClientUser } from "@/lib/db/supabase/auth-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { queryKeys } from "../keys";
import { invalidateAccountRelated } from "../invalidation";
import { queueManager } from "@/lib/sync/queueManager";
import { isNetworkError } from "@/lib/utils/network";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];

/**
 * Создаёт новый счёт
 */
async function createAccount(
  data: Omit<AccountInsert, "user_id">
): Promise<Account> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const supabase = createClient();

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      ...data,
      user_id: user.id,
    })
    .select(
      "id, user_id, name, type, currency, balance, icon, color, is_archived, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return account as Account;
}

/**
 * Обновляет существующий счёт
 * Оптимизировано: использует getClientUser() и конкретные поля
 */
async function updateAccount(
  id: string,
  updates: AccountUpdate
): Promise<Account> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("accounts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, user_id, name, type, currency, balance, icon, color, is_archived, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data as Account;
}

/**
 * Удаляет (архивирует) счёт
 */
async function deleteAccount(id: string): Promise<void> {
  const user = await getClientUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("accounts")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

/**
 * Хук для создания счёта с оптимистичным обновлением
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: (data: Omit<AccountInsert, "user_id">) => createAccount(data),
    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.accounts.all,
      });

      const previousAccounts = queryClient.getQueryData<Account[]>(
        queryKeys.accounts.list()
      );

      // Оптимистично добавляем новый счёт
      const optimisticAccount: Account = {
        id: `temp-${Date.now()}`,
        user_id: "",
        name: newAccount.name || "",
        type: newAccount.type || "card",
        currency: newAccount.currency || "RUB",
        balance: newAccount.balance || 0,
        icon: newAccount.icon || null,
        color: newAccount.color || null,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Account[]>(queryKeys.accounts.list(), (old) =>
        old ? [...old, optimisticAccount] : [optimisticAccount]
      );

      return { previousAccounts };
    },
    onError: async (err, variables, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue("accounts", "create", null, variables);
          toast.success(tSync("changesWillSync"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousAccounts) {
        queryClient.setQueryData(
          queryKeys.accounts.list(),
          context.previousAccounts
        );
      }
      console.error("Error creating account:", err);
      const errorMessage = getErrorMessage(err, (key) => t(`errors.${key}`));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("accounts.success.created"));
    },
    onSettled: () => {
      invalidateAccountRelated(queryClient);
    },
  });
}

/**
 * Хук для обновления счёта с оптимистичным обновлением
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AccountUpdate }) =>
      updateAccount(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.accounts.all,
      });

      const previousAccounts = queryClient.getQueryData<Account[]>(
        queryKeys.accounts.list()
      );

      // Оптимистично обновляем счёт
      queryClient.setQueryData<Account[]>(queryKeys.accounts.list(), (old) => {
        if (!old) return old;
        return old.map((acc) =>
          acc.id === id
            ? { ...acc, ...updates, updated_at: new Date().toISOString() }
            : acc
        );
      });

      return { previousAccounts };
    },
    onError: async (err, variables, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue(
            "accounts",
            "update",
            variables.id,
            variables.updates
          );
          toast.success(tSync("changesWillSync"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousAccounts) {
        queryClient.setQueryData(
          queryKeys.accounts.list(),
          context.previousAccounts
        );
      }
      console.error("Error updating account:", err);
      const errorMessage = getErrorMessage(err, (key) => t(`errors.${key}`));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("accounts.success.updated"));
    },
    onSettled: () => {
      invalidateAccountRelated(queryClient);
    },
  });
}

/**
 * Хук для удаления (архивирования) счёта с оптимистичным обновлением
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tSync = useTranslations("sync");

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.accounts.all,
      });

      const previousAccounts = queryClient.getQueryData<Account[]>(
        queryKeys.accounts.list()
      );

      // Оптимистично удаляем счёт
      queryClient.setQueryData<Account[]>(queryKeys.accounts.list(), (old) =>
        old ? old.filter((acc) => acc.id !== id) : []
      );

      return { previousAccounts };
    },
    onError: async (err, id, context) => {
      // Если это сетевая ошибка - добавляем в очередь
      if (isNetworkError(err)) {
        try {
          await queueManager.enqueue("accounts", "delete", id, null);
          toast.success(tSync("changesWillSync"));
          return;
        } catch (queueError) {
          console.error("Error adding to sync queue:", queueError);
        }
      }

      // Для других ошибок откатываем изменения
      if (context?.previousAccounts) {
        queryClient.setQueryData(
          queryKeys.accounts.list(),
          context.previousAccounts
        );
      }
      console.error("Error deleting account:", err);
      const errorMessage = getErrorMessage(err, (key) => t(`errors.${key}`));
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success(t("accounts.success.deleted"));
    },
    onSettled: () => {
      invalidateAccountRelated(queryClient);
    },
  });
}
