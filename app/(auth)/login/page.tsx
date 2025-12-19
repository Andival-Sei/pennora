"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "../actions";
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
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleButton } from "@/components/ui/google-button";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tErrors = useTranslations();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isValid },
    control,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched", // Валидация после первого взаимодействия с полем
  });

  const passwordValue = useWatch({ control, name: "password" });

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    const result = await signIn(formData);
    if (result?.error) {
      setServerError(result.error);
      setLoading(false);
    }
  }

  // Показываем ошибку только если поле было затронуто
  const showError = (field: keyof LoginFormData) =>
    touchedFields[field] && errors[field];

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
              {t("login.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("login.subtitle")}
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
                  aria-invalid={!!showError("password")}
                  value={passwordValue || ""}
                  {...register("password")}
                />
                <AnimatePresence mode="wait">
                  {showError("password") && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive"
                    >
                      {t(errors.password?.message as string)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isValid}
              >
                {loading ? t("loading") : t("login.submit")}
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
                {t("login.noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  {t("login.registerLink")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
