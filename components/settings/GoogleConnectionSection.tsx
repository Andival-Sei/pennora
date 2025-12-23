"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Loader2 } from "lucide-react";

interface UserIdentity {
  provider: string;
  id: string;
}

interface GoogleConnectionSectionProps {
  identities: UserIdentity[];
  hasPassword: boolean;
  onUpdate: (identities: UserIdentity[]) => void;
}

/**
 * Компонент секции привязки Google аккаунта
 */
export function GoogleConnectionSection({
  identities,
  hasPassword,
  onUpdate,
}: GoogleConnectionSectionProps) {
  const t = useTranslations("settings");
  const tErrors = useTranslations();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGoogleLinked = identities.some((i) => i.provider === "google");

  async function handleLinkGoogle() {
    setLoading(true);
    const supabase = createClient();

    // Используем утилиту для получения правильного базового URL
    const appUrl = getAppUrl();
    const redirectTo = `${appUrl}/callback?next=/dashboard/settings`;

    await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  }

  async function handleUnlinkGoogle() {
    const googleIdentity = identities.find((i) => i.provider === "google");
    if (!googleIdentity) return;

    // Нельзя отвязать, если это единственный способ входа
    if (identities.length === 1 && !hasPassword) {
      setError("errors.cannotUnlinkOnly");
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: unlinkError } = await supabase.auth.unlinkIdentity({
      provider: "google",
      id: googleIdentity.id,
    } as Parameters<typeof supabase.auth.unlinkIdentity>[0]);

    if (unlinkError) {
      setError("errors.unknown");
    } else {
      onUpdate(identities.filter((i) => i.provider !== "google"));
    }

    setLoading(false);
  }

  return (
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
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("connections.unlink")}
              </Button>
            ) : (
              <Button onClick={handleLinkGoogle} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("connections.link")}
              </Button>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-destructive">{tErrors(error)}</p>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
