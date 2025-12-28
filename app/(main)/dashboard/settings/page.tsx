"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/db/supabase/client";
import { Loader2, Settings } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { EmailChangeSection } from "@/components/settings/EmailChangeSection";
import { PasswordChangeSection } from "@/components/settings/PasswordChangeSection";
import { GoogleConnectionSection } from "@/components/settings/GoogleConnectionSection";
import { AccountDeletionSection } from "@/components/settings/AccountDeletionSection";

interface UserIdentity {
  provider: string;
  id: string;
}

interface User {
  email: string;
  displayName: string;
  identities: UserIdentity[];
  hasPassword: boolean;
}

/**
 * Страница настроек аккаунта пользователя
 */
export default function SettingsPage() {
  const t = useTranslations("settings");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    }

    loadUser();
  }, []);

  const handleProfileUpdate = useCallback((displayName: string) => {
    setUser((prev) => (prev ? { ...prev, displayName } : null));
  }, []);

  const handleEmailUpdate = useCallback((newEmail: string) => {
    setUser((prev) => (prev ? { ...prev, email: newEmail } : null));
  }, []);

  const handleIdentitiesUpdate = useCallback((identities: UserIdentity[]) => {
    setUser((prev) => (prev ? { ...prev, identities } : null));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8 space-y-6">
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-8 w-8 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t("account.title")}
            </h2>
          </div>
        </FadeIn>
        <SettingsNavigation />

        <ProfileSection
          user={{ email: user.email, displayName: user.displayName }}
          onUpdate={handleProfileUpdate}
        />

        <EmailChangeSection
          currentEmail={user.email}
          onEmailUpdated={handleEmailUpdate}
        />

        <PasswordChangeSection hasPassword={user.hasPassword} />

        <GoogleConnectionSection
          identities={user.identities}
          hasPassword={user.hasPassword}
          onUpdate={handleIdentitiesUpdate}
        />

        <AccountDeletionSection />
      </ResponsiveContainer>
    </main>
  );
}
