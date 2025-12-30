"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus, Wallet, Receipt, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";
import { useTranslations } from "next-intl";
import { TransactionWizardLoading } from "@/components/features/transactions/TransactionWizardLoading";

// Lazy load TransactionWizard для уменьшения initial bundle size
const TransactionWizard = dynamic(
  () =>
    import("@/components/features/transactions/TransactionWizard").then(
      (mod) => ({ default: mod.TransactionWizard })
    ),
  {
    ssr: false,
    loading: () => <TransactionWizardLoading />,
  }
);

export function QuickActions() {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);

  return (
    <FadeIn delay={0.4}>
      <div className="flex flex-wrap gap-3 mb-8">
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("quickActions.addTransaction")}
        </Button>
        <TransactionWizard
          open={open}
          onOpenChange={setOpen}
          onSuccess={() => {
            setOpen(false);
          }}
        />
        <Link href="/dashboard/accounts?action=add">
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            {t("quickActions.addAccount")}
          </Button>
        </Link>
        <Link href="/dashboard/categories?action=add">
          <Button variant="outline" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            {t("quickActions.addCategory")}
          </Button>
        </Link>
        <Link href="/dashboard/transactions">
          <Button variant="outline" className="gap-2">
            <Receipt className="h-4 w-4" />
            {t("quickActions.viewTransactions")}
          </Button>
        </Link>
      </div>
    </FadeIn>
  );
}
