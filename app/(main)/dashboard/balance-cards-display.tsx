"use client";

/**
 * Client Component для отображения уже сконвертированных балансов
 * Получает готовые данные от серверного компонента
 */

import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { formatCurrency } from "@/lib/currency/converter";
import type { CurrencyCode } from "@/lib/currency/rates";

interface BalanceCardsDisplayProps {
  totalBalance: number;
  cardBalance: number;
  cashBalance: number;
  displayCurrency: CurrencyCode;
  t: {
    total: string;
    card: string;
    cash: string;
  };
}

/**
 * Компонент для отображения балансов
 * Данные уже сконвертированы на сервере
 */
export function BalanceCardsDisplay({
  totalBalance,
  cardBalance,
  cashBalance,
  displayCurrency,
  t,
}: BalanceCardsDisplayProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">{t.total}</div>
            <div className="text-3xl font-bold">
              {formatCurrency(totalBalance, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
      <FadeIn delay={0.25}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">{t.card}</div>
            <div className="text-3xl font-bold">
              {formatCurrency(cardBalance, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
      <FadeIn delay={0.3}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">{t.cash}</div>
            <div className="text-3xl font-bold">
              {formatCurrency(cashBalance, displayCurrency)}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
