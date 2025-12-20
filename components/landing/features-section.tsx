"use client";

import { motion } from "framer-motion";
import { WifiOff, RefreshCw, Coins, Users } from "lucide-react";
import { ScrollFadeIn } from "@/components/motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const features = [
  {
    key: "offline",
    icon: WifiOff,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    key: "sync",
    icon: RefreshCw,
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-500/10 to-blue-500/10",
  },
  {
    key: "multicurrency",
    icon: Coins,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    key: "shared",
    icon: Users,
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10",
  },
] as const;

export function FeaturesSection() {
  const tFeatures = useTranslations("home.features");
  const tSection = useTranslations("home.featuresSection");

  return (
    <section className="relative py-24 bg-zinc-950/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollFadeIn className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {tSection("title")}
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
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
                    "border-white/10 hover:border-white/20",
                    "transition-all duration-300"
                  )}
                  whileHover={{
                    scale: 1.05,
                    rotateY: 5,
                    rotateX: 5,
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                  }}
                >
                  {/* Gradient border glow */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl",
                      feature.gradient
                    )}
                    style={{ zIndex: -1 }}
                  />

                  {/* Icon */}
                  <div className="mb-6">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center",
                        feature.gradient,
                        "shadow-lg shadow-black/50"
                      )}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {tFeatures(feature.key)}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {tFeatures(`${feature.key}Desc`)}
                  </p>

                  {/* Hover glow effect */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300",
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
