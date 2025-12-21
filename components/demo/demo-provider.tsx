"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { CurrencyCode } from "@/lib/currency/rates";

// Типы для демо-данных
export interface DemoAccount {
  id: string;
  name: string;
  type: "card" | "cash";
  currency: CurrencyCode;
  balance: number;
  bank?: string;
}

export interface DemoCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface DemoTransaction {
  id: string;
  account_id: string;
  category_id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  currency: CurrencyCode;
  description: string;
  date: string;
  to_account_id?: string | null;
}

interface DemoContextType {
  // Данные
  currency: CurrencyCode;
  accounts: DemoAccount[];
  categories: DemoCategory[];
  transactions: DemoTransaction[];

  // Состояние демо
  currentStep: DemoStep;
  isRunning: boolean;

  // Методы
  setCurrency: (currency: CurrencyCode) => void;
  addAccount: (account: DemoAccount) => void;
  addCategory: (category: DemoCategory) => void;
  addTransaction: (transaction: DemoTransaction) => void;
  setCurrentStep: (step: DemoStep) => void;
  setIsRunning: (running: boolean) => void;
  reset: () => void;
}

export type DemoStep =
  | "onboarding"
  | "accounts"
  | "categories"
  | "transactions"
  | "dashboard"
  | "complete";

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("RUB");
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [categories, setCategories] = useState<DemoCategory[]>([]);
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [currentStep, setCurrentStep] = useState<DemoStep>("onboarding");
  const [isRunning, setIsRunning] = useState(false);

  const addAccount = (account: DemoAccount) => {
    setAccounts((prev) => [...prev, account]);
  };

  const addCategory = (category: DemoCategory) => {
    setCategories((prev) => [...prev, category]);
  };

  const addTransaction = (transaction: DemoTransaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const reset = () => {
    setCurrency("RUB");
    setAccounts([]);
    setCategories([]);
    setTransactions([]);
    setCurrentStep("onboarding");
    setIsRunning(false);
  };

  return (
    <DemoContext.Provider
      value={{
        currency,
        accounts,
        categories,
        transactions,
        currentStep,
        isRunning,
        setCurrency,
        addAccount,
        addCategory,
        addTransaction,
        setCurrentStep,
        setIsRunning,
        reset,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}
