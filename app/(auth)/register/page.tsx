"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, resendConfirmationEmail } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleButton } from "@/components/ui/google-button";
import { CheckCircle2, Mail } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tErrors = useTranslations();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isValid },
    control,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched", // Валидация после первого взаимодействия с полем
  });

  const passwordValue = useWatch({ control, name: "password" });

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    setServerError(null);
    setResendSuccess(false);

    const formData = new FormData();
    formData.append("displayName", data.displayName);
    formData.append("email", data.email);
    formData.append("password", data.password);

    const result = await signUp(formData);
    if (result?.error) {
      setServerError(result.error);
      setLoading(false);
    } else if (result?.requiresConfirmation && result?.email) {
      // Показываем сообщение о необходимости подтверждения email
      setServerError(null);
      setRegisteredEmail(result.email);
      setRequiresConfirmation(true);
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    if (!registeredEmail) return;

    setResendLoading(true);
    setResendSuccess(false);
    setServerError(null);

    const result = await resendConfirmationEmail(registeredEmail);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setResendSuccess(true);
    }
    setResendLoading(false);
  }

  // Показываем ошибку только если поле было затронуто
  const showError = (field: keyof RegisterFormData) =>
    touchedFields[field] && errors[field];

  // Если требуется подтверждение email, показываем экран подтверждения
  if (requiresConfirmation && registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <FadeIn className="absolute right-4 top-4 flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
        </FadeIn>

        <FadeIn className="w-full max-w-md">
          <Card className="border-border bg-card">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {t("register.emailConfirmation.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("register.emailConfirmation.message", {
                  email: registeredEmail,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                  >
                    {tErrors(serverError)}
                  </motion.div>
                )}
                {resendSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("register.emailConfirmation.resendSuccess")}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
                disabled={resendLoading}
              >
                {resendLoading
                  ? t("loading")
                  : t("register.emailConfirmation.resendButton")}
              </Button>
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  {t("register.emailConfirmation.backToLogin")}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <FadeIn className="absolute right-4 top-4 flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </FadeIn>

      <FadeIn className="w-full max-w-md">
        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
            >
              ← {t("backToHome")}
            </Link>
            <CardTitle className="text-2xl font-bold text-center">
              {t("register.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("register.subtitle")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                  >
                    {tErrors(serverError)}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="displayName">{t("displayName")}</Label>
                <Input
                  id="displayName"
                  placeholder={t("placeholders.displayName")}
                  aria-invalid={!!showError("displayName")}
                  {...register("displayName")}
                />
                <AnimatePresence mode="wait">
                  {showError("displayName") && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive"
                    >
                      {t(errors.displayName?.message as string)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  aria-invalid={!!showError("email")}
                  {...register("email")}
                />
                <AnimatePresence mode="wait">
                  {showError("email") && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive"
                    >
                      {t(errors.email?.message as string)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  showStrengthIndicator
                  strengthLabels={{
                    weak: t("passwordStrength.weak"),
                    fair: t("passwordStrength.fair"),
                    good: t("passwordStrength.good"),
                    strong: t("passwordStrength.strong"),
                  }}
                  requirementLabels={{
                    latinOnly: t("passwordRequirements.latinOnly"),
                    minLength: t("passwordRequirements.minLength"),
                    hasUppercase: t("passwordRequirements.hasUppercase"),
                    hasLowercase: t("passwordRequirements.hasLowercase"),
                    hasNumber: t("passwordRequirements.hasNumber"),
                  }}
                  aria-invalid={!!showError("password")}
                  value={passwordValue || ""}
                  {...register("password", {
                    onChange: () => {
                      // Перевалидируем пароль при каждом изменении для обновления состояния формы
                      if (touchedFields.password) {
                        trigger("password");
                      }
                    },
                  })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isValid}
              >
                {loading ? t("loading") : t("register.submit")}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {t("orContinueWith")}
                  </span>
                </div>
              </div>

              <GoogleButton className="w-full">
                {t("continueWithGoogle")}
              </GoogleButton>

              <p className="text-sm text-muted-foreground text-center">
                {t("register.hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  {t("register.loginLink")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
