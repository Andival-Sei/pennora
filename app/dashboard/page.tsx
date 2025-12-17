import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import { Settings } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const t = await getTranslations("dashboard");
  const tAuth = await getTranslations("auth");

  return (
    <main className="min-h-screen bg-background">
      <FadeIn>
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <ResponsiveContainer className="flex items-center justify-between py-4">
            <h1 className="text-xl font-bold text-foreground">Pennora</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <LocaleToggle />
              <ThemeToggle />
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <form action={signOut}>
                <Button variant="outline" size="sm">
                  {tAuth("logout")}
                </Button>
              </form>
            </div>
          </ResponsiveContainer>
        </header>
      </FadeIn>

      <ResponsiveContainer className="py-8">
        <FadeIn delay={0.1}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("title")}</h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-muted-foreground">{t("welcome")}</p>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
