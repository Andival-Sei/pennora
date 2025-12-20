"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "@/providers";
import { createClient } from "@/lib/supabase/client";
import { setLocale } from "@/i18n/actions";
import { useUnsavedChanges } from "./handle-unsaved-changes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import { Check, Loader2, Monitor, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CurrencyCode } from "@/lib/currency/rates";
import type { Locale } from "@/i18n/request";

type Theme = "light" | "dark" | "system";

export default function AppSettingsPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tApp = useTranslations("settings.app");
  const tOnboarding = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations();

  const { theme: currentTheme, setTheme: setThemeProvider } = useTheme();
  const [locale, setLocaleState] = useState<Locale>("ru");
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>("RUB");
  
  // Исходные значения для сравнения
  const [originalTheme, setOriginalTheme] = useState<Theme>("system");
  const [originalLocale, setOriginalLocale] = useState<Locale>("ru");
  const [originalDisplayCurrency, setOriginalDisplayCurrency] = useState<CurrencyCode>("RUB");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Проверяем, есть ли изменения
  const hasChanges =
    currentTheme !== originalTheme ||
    locale !== originalLocale ||
    displayCurrency !== originalDisplayCurrency;

  useEffect(() => {
    loadSettings();
  }, []);

  // Функция для сброса к исходным значениям
  const handleReset = useCallback(() => {
    setThemeProvider(originalTheme);
    setLocaleState(originalLocale);
    setDisplayCurrency(originalDisplayCurrency);
  }, [originalTheme, originalLocale, originalDisplayCurrency, setThemeProvider]);

  // Обработка несохранённых изменений при выходе
  useUnsavedChanges({
    hasChanges,
    originalTheme,
    originalLocale,
    originalDisplayCurrency,
    currentTheme,
    currentLocale: locale,
    currentDisplayCurrency: displayCurrency,
    onReset: handleReset,
  });

  // При размонтировании компонента (выход без сохранения) возвращаем настройки к исходным
  useEffect(() => {
    return () => {
      // Если есть несохранённые изменения, возвращаем к исходным значениям
      if (hasChanges) {
        setThemeProvider(originalTheme);
        setLocaleState(originalLocale);
        setDisplayCurrency(originalDisplayCurrency);
        
        // Возвращаем язык к исходному
        if (locale !== originalLocale) {
          startTransition(() => {
            setLocale(originalLocale);
          });
        }
        
        // Возвращаем тему к исходной
        if (typeof window !== "undefined") {
          localStorage.setItem("pennora-theme", originalTheme);
        }
      }
    };
  }, []); // Только при размонтировании

  async function loadSettings() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("theme, locale, display_currency")
      .eq("id", user.id)
      .single();

    if (profile) {
      const theme = (profile.theme && ["light", "dark", "system"].includes(profile.theme)
        ? profile.theme
        : "system") as Theme;
      const localeValue = (profile.locale && ["ru", "en"].includes(profile.locale)
        ? profile.locale
        : "ru") as Locale;
      const currency = (profile.display_currency &&
      ["RUB", "USD", "EUR"].includes(profile.display_currency)
        ? profile.display_currency
        : "RUB") as CurrencyCode;

      // Устанавливаем исходные значения
      setOriginalTheme(theme);
      setOriginalLocale(localeValue);
      setOriginalDisplayCurrency(currency);

      // Устанавливаем текущие значения
      setThemeProvider(theme);
      setLocaleState(localeValue);
      setDisplayCurrency(currency);
    }

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Обновляем настройки в БД
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        theme: currentTheme,
        locale: locale,
        display_currency: displayCurrency,
      })
      .eq("id", user.id);

    if (updateError) {
      setError("errors.databaseError");
      setSaving(false);
      return;
    }

    // Обновляем исходные значения после успешного сохранения
    setOriginalTheme(currentTheme);
    setOriginalLocale(locale);
    setOriginalDisplayCurrency(displayCurrency);

    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  }

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
              {tApp("title")}
            </h1>
          </ResponsiveContainer>
        </header>
      </FadeIn>

      <ResponsiveContainer className="py-8 space-y-6">
        {/* Навигация по разделам */}
        <FadeIn delay={0.05}>
          <div className="flex gap-2 mb-6">
            <Link href="/dashboard/settings?section=account">
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
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>{t("theme.title")}</CardTitle>
              <CardDescription>{tApp("theme.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button
                  variant={currentTheme === "light" ? "default" : "outline"}
                  onClick={() => {
                    setThemeProvider("light");
                    if (typeof window !== "undefined") {
                      localStorage.setItem("pennora-theme", "light");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  {t("theme.light")}
                </Button>
                <Button
                  variant={currentTheme === "system" ? "default" : "outline"}
                  onClick={() => {
                    setThemeProvider("system");
                    if (typeof window !== "undefined") {
                      localStorage.setItem("pennora-theme", "system");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  {t("theme.system")}
                </Button>
                <Button
                  variant={currentTheme === "dark" ? "default" : "outline"}
                  onClick={() => {
                    setThemeProvider("dark");
                    if (typeof window !== "undefined") {
                      localStorage.setItem("pennora-theme", "dark");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  {t("theme.dark")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card>
            <CardHeader>
              <CardTitle>{t("language.title")}</CardTitle>
              <CardDescription>{tApp("language.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={locale}
                onValueChange={(value) => {
                  const newLocale = value as Locale;
                  setLocaleState(newLocale);
                  // Применяем язык сразу локально
                  startTransition(() => {
                    setLocale(newLocale);
                  });
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">{t("language.ru")}</SelectItem>
                  <SelectItem value="en">{t("language.en")}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>{tApp("currency.title")}</CardTitle>
              <CardDescription>{tApp("currency.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={displayCurrency}
                onValueChange={(value) => setDisplayCurrency(value as CurrencyCode)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RUB">
                    {tOnboarding("currency.options.RUB.name")}
                  </SelectItem>
                  <SelectItem value="USD">
                    {tOnboarding("currency.options.USD.name")}
                  </SelectItem>
                  <SelectItem value="EUR">
                    {tOnboarding("currency.options.EUR.name")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div className="flex items-center justify-end gap-4">
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
                  {tApp("success")}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {tCommon("save")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}

