"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/db/supabase/client";
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

/**
 * Обновляет существующий счёт
 */
async function updateAccount(
  id: string,
  updates: AccountUpdate
): Promise<Account> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("accounts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Account;
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
