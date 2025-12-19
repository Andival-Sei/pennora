import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/motion";
import { ResponsiveContainer } from "@/components/layout";
import { FolderTree } from "lucide-react";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const t = await getTranslations("categories");

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8">
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <FolderTree className="h-8 w-8 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold">{t("title")}</h2>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-muted-foreground">{t("comingSoon")}</p>
        </FadeIn>
      </ResponsiveContainer>
    </main>
  );
}
