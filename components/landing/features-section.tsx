"use client";

import { motion } from "framer-motion";
import { WifiOff, RefreshCw, Coins, Users, Construction } from "lucide-react";
import { ScrollFadeIn } from "@/components/motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const features = [
  {
    key: "offline",
    icon: WifiOff,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
    inDevelopment: false,
  },
  {
    key: "sync",
    icon: RefreshCw,
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-500/10 to-blue-500/10",
    inDevelopment: false,
  },
  {
    key: "multicurrency",
    icon: Coins,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/10",
    inDevelopment: false,
  },
  {
    key: "shared",
    icon: Users,
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10",
    inDevelopment: true,
  },
] as const;

export function FeaturesSection() {
  const t = useTranslations("home");
  const tFeatures = useTranslations("home.features");
  const tSection = useTranslations("home.featuresSection");

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollFadeIn className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {tSection("title")}
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {tSection("subtitle")}
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollFadeIn key={feature.key} delay={index * 0.1}>
                <motion.div
                  className={cn(
                    "relative group p-8 rounded-2xl border backdrop-blur-xl",
                    "bg-gradient-to-br",
                    feature.bgGradient,
                    "border-zinc-200/50 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/30",
                    "bg-white/50 dark:bg-zinc-900/30",
                    "transition-all duration-300",
                    "h-full flex flex-col"
                  )}
                  whileHover={{
                    scale: 1.02,
                    y: -4,
                  }}
                >
                  {/* Gradient border glow - уменьшенная интенсивность */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-2xl",
                      feature.gradient
                    )}
                    style={{ zIndex: -1 }}
                  />

                  {/* Icon */}
                  <div className="mb-6 flex items-center gap-3">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                        feature.gradient,
                        "shadow-lg shadow-black/50"
                      )}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    {feature.inDevelopment && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                        <Construction className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">
                          {t("cta.inDevelopment")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                      {tFeatures(feature.key)}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed flex-1">
                      {tFeatures(`${feature.key}Desc`)}
                    </p>
                  </div>

                  {/* Hover glow effect - уменьшенная интенсивность */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                      `bg-gradient-to-br ${feature.gradient}`
                    )}
                    style={{ zIndex: -1 }}
                  />
                </motion.div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
