"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Trash2 } from "lucide-react";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { deleteAccount } from "@/app/(main)/dashboard/actions";

/**
 * Компонент секции удаления аккаунта
 */
export function AccountDeletionSection() {
  const t = useTranslations("settings");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError(null);

    const result = await deleteAccount();

    // Если функция вернула результат, значит была ошибка
    // (если редирект произошел успешно, функция не вернет значение из-за redirect())
    if (result?.error) {
      setDeleteError("errors.unknown");
      setDeleteLoading(false);
      return;
    }

    // Если ошибки нет, серверный redirect() должен сработать автоматически
    // Закрываем модальное окно (редirect произойдет на сервере)
    setShowDeleteConfirm(false);
  }

  return (
    <>
      <FadeIn delay={0.35}>
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("account.deleteAccount.title")}
            </CardTitle>
            <CardDescription>
              {t("account.deleteAccount.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("account.deleteAccount.button")}
            </Button>
          </CardContent>
        </Card>
      </FadeIn>

      <DeleteAccountModal
        open={showDeleteConfirm}
        onClose={() => !deleteLoading && setShowDeleteConfirm(false)}
        loading={deleteLoading}
        error={deleteError}
        onDelete={handleDeleteAccount}
      />
    </>
  );
}
