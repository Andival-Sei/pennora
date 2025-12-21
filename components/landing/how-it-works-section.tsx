"use client";

import { motion } from "framer-motion";
import { Plus, TrendingUp, Target, ArrowRight } from "lucide-react";
import { ScrollFadeIn } from "@/components/motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const steps = [
  {
    key: "step1",
    icon: Plus,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    key: "step2",
    icon: TrendingUp,
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-500/10 to-blue-500/10",
  },
  {
    key: "step3",
    icon: Target,
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10",
  },
] as const;

export function HowItWorksSection() {
  const t = useTranslations("home.howItWorks");

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollFadeIn className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </ScrollFadeIn>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <ScrollFadeIn key={step.key} delay={index * 0.15}>
                  <motion.div
                    className={cn(
                      "relative group p-8 rounded-2xl border backdrop-blur-xl",
                      "bg-gradient-to-br",
                      step.bgGradient,
                      "border-zinc-200/50 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/30",
                      "bg-white/50 dark:bg-zinc-900/30",
                      "transition-all duration-300"
                    )}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Step number badge */}
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg z-10">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="mb-6">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center",
                          step.gradient,
                          "shadow-lg shadow-black/50"
                        )}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {t(`${step.key}.title`)}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {t(`${step.key}.description`)}
                      </p>
                    </div>

                    {/* Subtle hover glow */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                        `bg-gradient-to-br ${step.gradient}`
                      )}
                      style={{ zIndex: -1 }}
                    />

                    {/* Connector arrow (hidden on mobile) */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                        <div className="w-8 h-8 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-300/50 dark:border-white/10 backdrop-blur-sm flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </ScrollFadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
