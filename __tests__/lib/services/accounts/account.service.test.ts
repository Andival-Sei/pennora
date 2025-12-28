import { describe, it, expect } from "vitest";
import { AccountService } from "@/lib/services/accounts/account.service";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

describe("AccountService", () => {
  const mockAccounts: Account[] = [
    {
      id: "acc-1",
      name: "Cash RUB",
      type: "cash",
      currency: "RUB",
      balance: 1000,
      user_id: "user-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      is_archived: false,
      icon: null,
      color: null,
    },
    {
      id: "acc-2",
      name: "Cash USD",
      type: "cash",
      currency: "USD",
      balance: 100,
      user_id: "user-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      is_archived: false,
      icon: null,
      color: null,
    },
  ];

  describe("parseBalance", () => {
    it("should parse balance with comma as decimal separator", () => {
      expect(AccountService.parseBalance("100,5")).toBe(100.5);
    });

    it("should parse balance with dot as decimal separator", () => {
      expect(AccountService.parseBalance("100.5")).toBe(100.5);
    });

    it("should parse integer balance", () => {
      expect(AccountService.parseBalance("100")).toBe(100);
    });

    it("should handle zero", () => {
      expect(AccountService.parseBalance("0")).toBe(0);
    });
  });

  describe("formatCardAccountName", () => {
    const mockTOnboarding = (key: string): string => {
      const translations: Record<string, string> = {
        "card.banks.sberbank": "Сбербанк",
        "card.banks.tinkoff": "Тинькофф",
      };
      return translations[key] || key;
    };

    it("should format card account name with bank", () => {
      const result = AccountService.formatCardAccountName(
        "Зарплатная",
        "sberbank",
        mockTOnboarding
      );
      expect(result).toBe("Зарплатная (Сбербанк)");
    });

    it("should return name only for other bank", () => {
      const result = AccountService.formatCardAccountName(
        "Зарплатная",
        "other",
        mockTOnboarding
      );
      expect(result).toBe("Зарплатная");
    });
  });

  describe("prepareCardAccountData", () => {
    const mockTOnboarding = (key: string): string => {
      const translations: Record<string, string> = {
        "card.banks.sberbank": "Сбербанк",
      };
      return translations[key] || key;
    };

    it("should prepare card account data correctly", () => {
      const cardData = {
        name: "Зарплатная",
        bank: "sberbank",
        balance: "5000,5",
      };

      const result = AccountService.prepareCardAccountData(
        cardData,
        "user-1",
        "RUB",
        mockTOnboarding
      );

      expect(result).toEqual({
        user_id: "user-1",
        name: "Зарплатная (Сбербанк)",
        type: "card",
        currency: "RUB",
        balance: 5000.5,
      });
    });

    it("should handle other bank correctly", () => {
      const cardData = {
        name: "Другая карта",
        bank: "other",
        balance: "1000",
      };

      const result = AccountService.prepareCardAccountData(
        cardData,
        "user-1",
        "USD",
        mockTOnboarding
      );

      expect(result.name).toBe("Другая карта");
    });
  });

  describe("prepareCashAccountData", () => {
    it("should prepare cash account data correctly", () => {
      const cashData = {
        balance: "500,25",
      };

      const result = AccountService.prepareCashAccountData(
        cashData,
        "user-1",
        "RUB",
        "Наличные"
      );

      expect(result).toEqual({
        user_id: "user-1",
        name: "Наличные",
        type: "cash",
        currency: "RUB",
        balance: 500.25,
      });
    });
  });

  describe("getAvailableCashCurrencies", () => {
    it("should return currencies not yet in cash accounts", () => {
      const result = AccountService.getAvailableCashCurrencies(mockAccounts);
      expect(result).toEqual(["EUR"]);
    });

    it("should return all currencies if no cash accounts", () => {
      const noCashAccounts: Account[] = [];
      const result = AccountService.getAvailableCashCurrencies(noCashAccounts);
      expect(result).toEqual(["RUB", "USD", "EUR"]);
    });

    it("should return empty array if all currencies exist", () => {
      const allCurrencies: Account[] = [
        ...mockAccounts,
        {
          id: "acc-3",
          name: "Cash EUR",
          type: "cash",
          currency: "EUR",
          balance: 50,
          user_id: "user-1",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          is_archived: false,
          icon: null,
          color: null,
        },
      ];
      const result = AccountService.getAvailableCashCurrencies(allCurrencies);
      expect(result).toEqual([]);
    });
  });

  describe("hasAllCashCurrencies", () => {
    it("should return false if not all currencies exist", () => {
      const result = AccountService.hasAllCashCurrencies(mockAccounts);
      expect(result).toBe(false);
    });

    it("should return true if all currencies exist", () => {
      const allCurrencies: Account[] = [
        ...mockAccounts,
        {
          id: "acc-3",
          name: "Cash EUR",
          type: "cash",
          currency: "EUR",
          balance: 50,
          user_id: "user-1",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          is_archived: false,
          icon: null,
          color: null,
        },
      ];
      const result = AccountService.hasAllCashCurrencies(allCurrencies);
      expect(result).toBe(true);
    });

    it("should return false if no cash accounts", () => {
      const result = AccountService.hasAllCashCurrencies([]);
      expect(result).toBe(false);
    });
  });
});
