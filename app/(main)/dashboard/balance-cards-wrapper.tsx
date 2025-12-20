/**
 * Server Component wrapper для конвертации балансов на сервере
 * Выполняет конвертацию валют на сервере для улучшения производительности
 */

import { convertMultipleCurrencies } from "@/lib/currency/converter";
import { BalanceCardsDisplay } from "./balance-cards-display";
import type { CurrencyCode } from "@/lib/currency/rates";

interface Account {
  currency: CurrencyCode;
  balance: number;
  type: string;
}

interface BalanceCardsWrapperProps {
  accounts: Account[];
  displayCurrency: CurrencyCode;
  t: {
    total: string;
    card: string;
    cash: string;
  };
}

/**
 * Серверный компонент для конвертации балансов
 * Выполняет конвертацию на сервере, исключая клиентскую задержку
 */
export async function BalanceCardsWrapper({
  accounts,
  displayCurrency,
  t,
}: BalanceCardsWrapperProps) {
  // Конвертируем все балансы в выбранную валюту на сервере
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

  // Параллельная конвертация всех балансов
  let totalBalance: number;
  let cardBalance: number;
  let cashBalance: number;

  try {
    [totalBalance, cardBalance, cashBalance] = await Promise.all([
      convertMultipleCurrencies(allAmounts, displayCurrency),
      cardAmounts.length > 0
        ? convertMultipleCurrencies(cardAmounts, displayCurrency)
        : 0,
      cashAmounts.length > 0
        ? convertMultipleCurrencies(cashAmounts, displayCurrency)
        : 0,
    ]);
  } catch (error) {
    console.error("Error converting balances:", error);
    // Fallback: суммируем только одинаковую валюту
    totalBalance = accounts
      .filter((acc) => acc.currency === displayCurrency)
      .reduce((sum, acc) => sum + Number(acc.balance), 0);
    cardBalance = accounts
      .filter((acc) => acc.type === "card" && acc.currency === displayCurrency)
      .reduce((sum, acc) => sum + Number(acc.balance), 0);
    cashBalance = accounts
      .filter((acc) => acc.type === "cash" && acc.currency === displayCurrency)
      .reduce((sum, acc) => sum + Number(acc.balance), 0);
  }

  return (
    <BalanceCardsDisplay
      totalBalance={totalBalance}
      cardBalance={cardBalance}
      cashBalance={cashBalance}
      displayCurrency={displayCurrency}
      t={t}
    />
  );
}
