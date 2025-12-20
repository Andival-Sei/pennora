import {
  HeroSection,
  FeaturesSection,
  StatsSection,
  HowItWorksSection,
  FooterSection,
} from "@/components/landing";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  // Обрабатываем ошибки подключения к Supabase (например, при отсутствии интернета)
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    // Supabase может вернуть ошибку в объекте, а не выбросить исключение
    if (result.error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Supabase auth error (dev mode):", result.error.message);
      }
    } else {
      user = result.data?.user ?? null;
    }
  } catch (error) {
    // Обрабатываем сетевые ошибки и таймауты
    if (process.env.NODE_ENV === "development") {
      console.warn("Supabase connection error (dev mode):", error);
    }
  }

  return (
    <main className="relative min-h-screen">
      {/* Theme and Locale toggles in hero - только для незалогиненных */}
      {!user && (
        <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      )}

      <HeroSection user={user || null} />
      <FeaturesSection />
      <StatsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
