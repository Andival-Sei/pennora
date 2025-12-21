"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Loader2, Wallet, CreditCard, Banknote } from "lucide-react";
import {
  convertMultipleCurrencies,
  formatCurrency,
} from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";

interface Account {
  currency: CurrencyCode;
  balance: number;
  type: string;
}

interface BalanceCardsProps {
  accounts: Account[];
  displayCurrency: CurrencyCode;
  t: {
    total: string;
    card: string;
    cash: string;
  };
}

export function BalanceCards({
  accounts,
  displayCurrency,
  t,
}: BalanceCardsProps) {
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [cardBalance, setCardBalance] = useState<number | null>(null);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateBalances() {
      setLoading(true);

      try {
        // Конвертируем все балансы в выбранную валюту
        const allAmounts = accounts.map((acc) => ({
          amount: Number(acc.balance),
          currency: acc.currency,
        }));

        const cardAmounts = accounts
          .filter((acc) => acc.type === "card")
          .map((acc) => ({
            amount: Number(acc.balance),
            currency: acc.currency,
          }));

        const cashAmounts = accounts
          .filter((acc) => acc.type === "cash")
          .map((acc) => ({
            amount: Number(acc.balance),
            currency: acc.currency,
          }));

        const [total, card, cash] = await Promise.all([
          convertMultipleCurrencies(allAmounts, displayCurrency),
          cardAmounts.length > 0
            ? convertMultipleCurrencies(cardAmounts, displayCurrency)
            : 0,
          cashAmounts.length > 0
            ? convertMultipleCurrencies(cashAmounts, displayCurrency)
            : 0,
        ]);

        setTotalBalance(total);
        setCardBalance(card);
        setCashBalance(cash);
      } catch (error) {
        console.error("Error calculating balances:", error);
        // Fallback: суммируем только одинаковую валюту
        const total = accounts
          .filter((acc) => acc.currency === displayCurrency)
          .reduce((sum, acc) => sum + Number(acc.balance), 0);
        const card = accounts
          .filter(
            (acc) => acc.type === "card" && acc.currency === displayCurrency
          )
          .reduce((sum, acc) => sum + Number(acc.balance), 0);
        const cash = accounts
          .filter(
            (acc) => acc.type === "cash" && acc.currency === displayCurrency
          )
          .reduce((sum, acc) => sum + Number(acc.balance), 0);

        setTotalBalance(total);
        setCardBalance(card);
        setCashBalance(cash);
      } finally {
        setLoading(false);
      }
    }

    calculateBalances();
  }, [accounts, displayCurrency]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <FadeIn key={i} delay={0.1 * i}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <FadeIn delay={0.2}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{t.total}</div>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {totalBalance !== null
                ? formatCurrency(totalBalance, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
      <FadeIn delay={0.25}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{t.card}</div>
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold">
              {cardBalance !== null
                ? formatCurrency(cardBalance, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
      <FadeIn delay={0.3}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{t.cash}</div>
              <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-bold">
              {cashBalance !== null
                ? formatCurrency(cashBalance, displayCurrency)
                : formatCurrency(0, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
