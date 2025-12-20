"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FadeIn } from "@/components/motion";
import { TransactionList } from "./TransactionList";
import { TransactionForm } from "./TransactionForm";

export function TransactionPageContent() {
  const t = useTranslations("transactions");
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0); // To force refresh list

  return (
    <div className="space-y-6">
      <FadeIn delay={0.1}>
        <div className="flex items-center justify-between">
          <div>{/* Title is in the parent page or we can move it here */}</div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("add")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createTitle")}</DialogTitle>
              </DialogHeader>
              <TransactionForm
                onSuccess={() => {
                  setOpen(false);
                  setKey((prev) => prev + 1); // Refresh list
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <TransactionList key={key} />
      </FadeIn>
    </div>
  );
}
