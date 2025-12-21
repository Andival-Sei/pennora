"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "./phone-mockup";
import { FadeIn } from "@/components/motion";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";

interface HeroSectionProps {
  user: User | null;
}

export function HeroSection({ user }: HeroSectionProps) {
  const t = useTranslations("home");
  const tAuth = useTranslations("auth");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Navigation */}
      {!user && (
        <FadeIn className="absolute top-6 right-6 z-50 flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {tAuth("login.title")}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-black"
            >
              {tAuth("register.title")}
            </Button>
          </Link>
        </FadeIn>
      )}

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left space-y-8">
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 bg-clip-text text-transparent">
                {t("titleGradient")}
              </span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t("subtitle")}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {user ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-emerald-500 hover:bg-emerald-600 text-black text-lg px-8 py-6 shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all duration-300"
                  >
                    {t("backToApp")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-emerald-500 hover:bg-emerald-600 text-black text-lg px-8 py-6 shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all duration-300"
                    >
                      {t("cta.startFree")}
                    </Button>
                  </Link>
                  <Link href="#demo">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-emerald-500/50 text-white hover:bg-emerald-500/10 text-lg px-8 py-6 backdrop-blur-sm"
                    >
                      {t("cta.demo")}
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          {/* Right side - Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
