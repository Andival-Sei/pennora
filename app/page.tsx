import {
  HeroSection,
  FeaturesSection,
  StatsSection,
  HowItWorksSection,
  FooterSection,
} from "@/components/landing";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Theme and Locale toggles in hero */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
