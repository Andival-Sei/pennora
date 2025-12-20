"use client";

import { ScrollFadeIn, Counter } from "@/components/motion";
import { useTranslations } from "next-intl";

const stats = [
  { value: 10000, suffix: "+", key: "users" },
  { value: 50, suffix: "+", key: "countries" },
  { value: 4.8, suffix: "★", decimals: 1, key: "rating" },
] as const;

export function StatsSection() {
  const t = useTranslations("home.stats");

  return (
    <section className="relative py-20 bg-gradient-to-b from-zinc-950/50 to-zinc-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <ScrollFadeIn key={stat.key} delay={index * 0.1}>
              <div className="text-center space-y-2">
                <div className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  <Counter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </div>
                <p className="text-xl text-zinc-400">{t(stat.key)}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
