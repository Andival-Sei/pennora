"use client";

import {
  HeroSection,
  FeaturesSection,
  StatsSection,
  HowItWorksSection,
  FooterSection,
} from "@/components/landing";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((result) => {
      if (!result.error) {
        setUser(result.data?.user ?? null);
      }
    });
  }, []);

  return (
    <main className="relative min-h-screen">
      {/* Animated gradient background для всего лендинга */}
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950"
          animate={{
            background: [
              "linear-gradient(135deg, #0a0a0a 0%, #18181b 50%, #0a0a0a 100%)",
              "linear-gradient(135deg, #18181b 0%, #0a0a0a 50%, #18181b 100%)",
              "linear-gradient(135deg, #0a0a0a 0%, #18181b 50%, #0a0a0a 100%)",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating green spots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-500/10 blur-3xl"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: `${10 + i * 15}%`,
              top: `${10 + i * 10}%`,
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Theme and Locale toggles - только для незалогиненных */}
      {!user && (
        <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      )}

      {/* Контент поверх фона */}
      <div className="relative z-10">
        <HeroSection user={user || null} />
        <FeaturesSection />
        <StatsSection />
        <HowItWorksSection />
        <FooterSection />
      </div>
    </main>
  );
}
