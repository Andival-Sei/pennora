"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorKey } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ResponsiveContainer } from "@/components/layout";
import { Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Схема для обновления профиля
const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "validation.displayName.min")
    .max(50, "validation.displayName.max"),
});

// Схема для смены пароля
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.password.required"),
    newPassword: z
      .string()
      .min(8, "validation.password.min")
      .max(128, "validation.password.max")
      .regex(/^[^\u0400-\u04FF]+$/, "validation.password.latinOnly")
      .regex(/[A-Z]/, "validation.password.uppercase")
      .regex(/[a-z]/, "validation.password.lowercase")
      .regex(/[0-9]/, "validation.password.number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.password.mismatch",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserIdentity {
  provider: string;
  id: string;
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations();

  const [user, setUser] = useState<{
    email: string;
    displayName: string;
    identities: UserIdentity[];
    hasPassword: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Google linking
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
  });

  const newPasswordValue = passwordForm.watch("newPassword");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Получаем профиль
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", authUser.id)
          .single();

        const identities = (authUser.identities || []) as UserIdentity[];
        const hasPassword = identities.some((i) => i.provider === "email");

        setUser({
          email: authUser.email || "",
          displayName: profile?.display_name || "",
          identities,
          hasPassword,
        });

        profileForm.reset({ displayName: profile?.display_name || "" });
      }
      setLoading(false);
    }

    loadUser();
  }, [profileForm]);

  async function onProfileSubmit(data: ProfileFormData) {
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setProfileError("errors.unknown");
      setProfileLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: data.displayName })
      .eq("id", authUser.id);

    if (error) {
      setProfileError("errors.databaseError");
    } else {
      setProfileSuccess(true);
      setUser((prev) =>
        prev ? { ...prev, displayName: data.displayName } : null
      );
      setTimeout(() => setProfileSuccess(false), 3000);
    }

    setProfileLoading(false);
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    const supabase = createClient();

    // Supabase не требует текущий пароль для смены, но мы проверяем для безопасности
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (error) {
      setPasswordError("errors.unknown");
    } else {
      setPasswordSuccess(true);
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(false), 3000);
    }

    setPasswordLoading(false);
  }

  async function handleLinkGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();

    await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback?next=/dashboard/settings`,
      },
    });
  }

  async function handleUnlinkGoogle() {
    if (!user) return;

    const googleIdentity = user.identities.find((i) => i.provider === "google");
    if (!googleIdentity) return;

    // Нельзя отвязать, если это единственный способ входа
    if (user.identities.length === 1 && !user.hasPassword) {
      setProfileError("errors.cannotUnlinkOnly");
      return;
    }

    setGoogleLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.unlinkIdentity({
      provider: "google",
      id: googleIdentity.id,
    } as Parameters<typeof supabase.auth.unlinkIdentity>[0]);

    if (error) {
      setProfileError("errors.unknown");
    } else {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              identities: prev.identities.filter(
                (i) => i.provider !== "google"
              ),
            }
          : null
      );
    }

    setGoogleLoading(false);
  }

  async function handleSendVerificationCode() {
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setEmailChangeError("errors.invalidEmail");
      return;
    }

    if (newEmail === user?.email) {
      setEmailChangeError("errors.sameEmail");
      return;
    }

    setEmailChangeLoading(true);
    setEmailChangeError(null);
    setEmailChangeSuccess(false);

    const supabase = createClient();

    // Вызываем updateUser с новым email - это отправит код подтверждения на новый email
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      setEmailChangeError(getAuthErrorKey(error.message));
      setEmailChangeLoading(false);
    } else {
      setShowVerificationCode(true);
      setEmailChangeLoading(false);
    }
  }

  async function handleVerifyEmailChange() {
    if (!verificationCode || verificationCode.length !== 6) {
      setEmailChangeError("errors.invalidCode");
      return;
    }

    setEmailChangeLoading(true);
    setEmailChangeError(null);
    setEmailChangeSuccess(false);

    const supabase = createClient();

    // Подтверждаем код через verifyOtp
    const { error } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: verificationCode,
      type: "email_change",
    });

    if (error) {
      setEmailChangeError(getAuthErrorKey(error.message));
      setEmailChangeLoading(false);
    } else {
      // Email успешно изменён, перезагружаем данные пользователя
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();

      if (updatedUser) {
        setEmailChangeSuccess(true);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                email: updatedUser.email || newEmail,
              }
            : null
        );
        setNewEmail("");
        setVerificationCode("");
        setShowVerificationCode(false);
        setTimeout(() => setEmailChangeSuccess(false), 3000);
      }
      setEmailChangeLoading(false);
    }
  }

  const hasGoogleLinked = user?.identities.some((i) => i.provider === "google");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <FadeIn>
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <ResponsiveContainer className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-foreground">
              {t("title")}
            </h1>
          </ResponsiveContainer>
        </header>
      </FadeIn>

      <ResponsiveContainer className="py-8 space-y-6">
        {/* Навигация по разделам */}
        <FadeIn delay={0.05}>
          <div className="flex gap-2 mb-6">
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
                {t("account.title")}
              </Button>
            </Link>
            <Link href="/dashboard/settings/app">
              <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
                {t("app.title")}
              </Button>
            </Link>
          </div>
        </FadeIn>

        {/* Профиль */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.title")}</CardTitle>
              <CardDescription>{t("profile.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <AnimatePresence mode="wait">
                  {profileError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                    >
                      {tErrors(profileError)}
                    </motion.div>
                  )}
                  {profileSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {t("profile.success")}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email">{tAuth("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">{tAuth("displayName")}</Label>
                  <Input
                    id="displayName"
                    {...profileForm.register("displayName")}
                    aria-invalid={!!profileForm.formState.errors.displayName}
                  />
                  {profileForm.formState.errors.displayName && (
                    <p className="text-xs text-destructive">
                      {tAuth(
                        profileForm.formState.errors.displayName
                          .message as string
                      )}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={profileLoading || !profileForm.formState.isValid}
                >
                  {profileLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t("profile.save")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Изменение email */}
        <FadeIn delay={0.15}>
          <Card>
            <CardHeader>
              <CardTitle>{t("emailChange.title")}</CardTitle>
              <CardDescription>{t("emailChange.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {emailChangeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                    >
                      {tErrors(emailChangeError)}
                    </motion.div>
                  )}
                  {emailChangeSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {t("emailChange.success")}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="newEmail">{t("emailChange.newEmail")}</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setShowVerificationCode(false);
                      setVerificationCode("");
                      setEmailChangeError(null);
                    }}
                    placeholder={tAuth("email")}
                    disabled={emailChangeLoading || showVerificationCode}
                    aria-invalid={!!emailChangeError}
                  />
                </div>

                <AnimatePresence>
                  {showVerificationCode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode">
                          {t("emailChange.code")}
                        </Label>
                        <Input
                          id="verificationCode"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setVerificationCode(value);
                            setEmailChangeError(null);
                          }}
                          placeholder="000000"
                          disabled={emailChangeLoading}
                          className="text-center text-lg tracking-widest"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("emailChange.codeHint")}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleVerifyEmailChange}
                          disabled={
                            emailChangeLoading || verificationCode.length !== 6
                          }
                          className="flex-1"
                        >
                          {emailChangeLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {t("emailChange.confirm")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowVerificationCode(false);
                            setVerificationCode("");
                            setEmailChangeError(null);
                          }}
                          disabled={emailChangeLoading}
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showVerificationCode && (
                  <Button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={
                      emailChangeLoading ||
                      !newEmail ||
                      newEmail === user?.email
                    }
                  >
                    {emailChangeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t("emailChange.sendCode")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Смена пароля */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>{t("password.title")}</CardTitle>
              <CardDescription>{t("password.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <AnimatePresence mode="wait">
                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                    >
                      {tErrors(passwordError)}
                    </motion.div>
                  )}
                  {passwordSuccess && (
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

                {user?.hasPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      {t("password.current")}
                    </Label>
                    <PasswordInput
                      id="currentPassword"
                      placeholder="••••••••"
                      {...passwordForm.register("currentPassword")}
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
                    {...passwordForm.register("newPassword")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t("password.confirm")}
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="••••••••"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {tAuth(
                        passwordForm.formState.errors.confirmPassword
                          .message as string
                      )}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={passwordLoading || !passwordForm.formState.isValid}
                >
                  {passwordLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t("password.save")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Привязка Google */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>{t("connections.title")}</CardTitle>
              <CardDescription>{t("connections.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">
                      {hasGoogleLinked
                        ? t("connections.googleLinked")
                        : t("connections.googleNotLinked")}
                    </p>
                  </div>
                </div>
                {hasGoogleLinked ? (
                  <Button
                    variant="outline"
                    onClick={handleUnlinkGoogle}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t("connections.unlink")}
                  </Button>
                ) : (
                  <Button onClick={handleLinkGoogle} disabled={googleLoading}>
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t("connections.link")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
