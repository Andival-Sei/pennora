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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative min-h-screen">
      {/* Theme and Locale toggles in hero - только для незалогиненных */}
      {!user && (
        <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      )}

      <HeroSection user={user} />
      <FeaturesSection />
      <StatsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
