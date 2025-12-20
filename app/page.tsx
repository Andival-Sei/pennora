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
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch (error) {
    // В dev режиме игнорируем ошибки подключения к Supabase
    // В production это должно логироваться, но не ломать приложение
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
