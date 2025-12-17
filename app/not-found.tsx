import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import { Home } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <ResponsiveContainer className="text-center">
        <FadeIn>
          <div className="max-w-md mx-auto">
            <h1 className="text-9xl font-bold text-primary/20 mb-4">404</h1>
            <h2 className="text-3xl font-bold mb-4">{t("title")}</h2>
            <p className="text-muted-foreground mb-8">{t("description")}</p>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                {t("backToHome")}
              </Button>
            </Link>
          </div>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
