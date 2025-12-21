"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function DemoModal() {
  const t = useTranslations();
  const tAuth = useTranslations("auth");
  const tHome = useTranslations("home");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">
          {tHome("cta.demo")} завершена!
        </h2>
        <p className="text-muted-foreground mb-6">
          Вы увидели основные возможности Pennora. Теперь создайте свой аккаунт
          и начните управлять бюджетом.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Link href="/register" className="w-full">
            <Button
              size="lg"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black"
            >
              {tHome("cta.startFree")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <Link href="/login" className="w-full">
            <Button size="lg" variant="outline" className="w-full">
              {tAuth("login.title")}
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button size="lg" variant="ghost" className="w-full">
              {t("common.backToHome")}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
