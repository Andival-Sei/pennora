import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";

export default async function Home() {
  const t = await getTranslations("home");
  const tAuth = await getTranslations("auth");

  const features = [
    { icon: "📴", key: "offline" },
    { icon: "🔄", key: "sync" },
    { icon: "💱", key: "multicurrency" },
    { icon: "👨‍👩‍👧‍👦", key: "shared" },
  ] as const;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <FadeIn className="absolute right-4 top-4 flex items-center gap-2 sm:gap-4">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm" className="sm:size-default">
            {tAuth("login.title")}
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button size="sm" className="sm:size-default">
            {tAuth("register.title")}
          </Button>
        </Link>
        <LocaleToggle />
        <ThemeToggle />
      </FadeIn>

      <ResponsiveContainer size="lg" className="text-center">
        <FadeIn delay={0.1}>
          <h1 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
            {t("title")}
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mb-8 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </FadeIn>

        <StaggerContainer
          delayChildren={0.3}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left"
        >
          {features.map((feature) => (
            <StaggerItem key={feature.key}>
              <div className="rounded-lg border bg-card p-4 sm:p-6 transition-colors hover:bg-accent">
                <span className="text-2xl sm:text-3xl">{feature.icon}</span>
                <p className="mt-2 font-medium text-sm sm:text-base">
                  {t(`features.${feature.key}`)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </ResponsiveContainer>
    </main>
  );
}
