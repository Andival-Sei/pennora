"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePasswordChange } from "@/lib/hooks/usePasswordChange";

interface PasswordChangeSectionProps {
  hasPassword: boolean;
}

/**
 * Компонент секции смены пароля пользователя
 */
export function PasswordChangeSection({
  hasPassword,
}: PasswordChangeSectionProps) {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations();

  const { form, newPasswordValue, loading, error, success, onSubmit } =
    usePasswordChange();

  return (
    <FadeIn delay={0.2}>
      <Card>
        <CardHeader>
          <CardTitle>{t("password.title")}</CardTitle>
          <CardDescription>{t("password.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                >
                  {tErrors(error)}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t("password.success")}
                </motion.div>
              )}
            </AnimatePresence>

            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("password.current")}</Label>
                <PasswordInput
                  id="currentPassword"
                  placeholder="••••••••"
                  {...form.register("currentPassword")}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("password.new")}</Label>
              <PasswordInput
                id="newPassword"
                placeholder="••••••••"
                showStrengthIndicator
                strengthLabels={{
                  weak: tAuth("passwordStrength.weak"),
                  fair: tAuth("passwordStrength.fair"),
                  good: tAuth("passwordStrength.good"),
                  strong: tAuth("passwordStrength.strong"),
                }}
                requirementLabels={{
                  latinOnly: tAuth("passwordRequirements.latinOnly"),
                  minLength: tAuth("passwordRequirements.minLength"),
                  hasUppercase: tAuth("passwordRequirements.hasUppercase"),
                  hasLowercase: tAuth("passwordRequirements.hasLowercase"),
                  hasNumber: tAuth("passwordRequirements.hasNumber"),
                }}
                value={newPasswordValue || ""}
                {...form.register("newPassword")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("password.confirm")}</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {tAuth(
                    form.formState.errors.confirmPassword.message as string
                  )}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading || !form.formState.isValid}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("password.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
