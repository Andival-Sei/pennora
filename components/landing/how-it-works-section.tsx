"use client";

import { motion } from "framer-motion";
import { Plus, TrendingUp, Target } from "lucide-react";
import { ScrollFadeIn } from "@/components/motion";
import { useTranslations } from "next-intl";

const steps = [
  {
    key: "step1",
    icon: Plus,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    key: "step2",
    icon: TrendingUp,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    key: "step3",
    icon: Target,
    gradient: "from-purple-500 to-pink-500",
  },
] as const;

export function HowItWorksSection() {
  const t = useTranslations("home.howItWorks");

  return (
    <section className="relative py-24 bg-zinc-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollFadeIn className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </ScrollFadeIn>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 transform -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <ScrollFadeIn key={step.key} delay={index * 0.2}>
                    <motion.div
                      className="relative text-center space-y-6"
                      whileHover={{ y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Step number */}
                      <div className="relative inline-flex items-center justify-center">
                        {/* Icon container */}
                        <div
                          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg shadow-black/50 relative z-10`}
                        >
                          <Icon className="w-10 h-10 text-white" />
                        </div>

                        {/* Glow effect */}
                        <div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-50 blur-xl`}
                        />
                      </div>

                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-white">
                          {t(`${step.key}.title`)}
                        </h3>
                        <p className="text-zinc-400 leading-relaxed">
                          {t(`${step.key}.description`)}
                        </p>
                      </div>

                      {/* Connector arrow (hidden on mobile) */}
                      {index < steps.length - 1 && (
                        <div className="hidden md:block absolute top-10 left-full w-8 h-8 text-cyan-500 transform translate-x-4">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-full h-full"
                          >
                            <path
                              d="M5 12h14M12 5l7 7-7 7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  </ScrollFadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
