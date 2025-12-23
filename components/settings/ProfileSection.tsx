"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Схема для обновления профиля
const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "validation.displayName.min")
    .max(50, "validation.displayName.max"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSectionProps {
  user: {
    email: string;
    displayName: string;
  };
  onUpdate: (displayName: string) => void;
}

/**
 * Компонент секции профиля пользователя
 */
export function ProfileSection({ user, onUpdate }: ProfileSectionProps) {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations();

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: user.displayName,
    },
  });

  const onSubmit = useCallback(
    async (data: ProfileFormData) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setError("errors.unknown");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: data.displayName })
        .eq("id", authUser.id);

      if (updateError) {
        setError("errors.databaseError");
      } else {
        setSuccess(true);
        onUpdate(data.displayName);
        setTimeout(() => setSuccess(false), 3000);
      }

      setLoading(false);
    },
    [onUpdate]
  );

  return (
    <FadeIn delay={0.1}>
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
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
                  {t("profile.success")}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">{tAuth("email")}</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">{tAuth("displayName")}</Label>
              <Input
                id="displayName"
                {...form.register("displayName")}
                aria-invalid={!!form.formState.errors.displayName}
              />
              {form.formState.errors.displayName && (
                <p className="text-xs text-destructive">
                  {tAuth(form.formState.errors.displayName.message as string)}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading || !form.formState.isValid}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("profile.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
