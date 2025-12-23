import { describe, it, expect } from "vitest";
import { TransactionService } from "@/lib/services/transactions/transaction.service";
import type {
  Transaction,
  TransactionFormValues,
} from "@/lib/validations/transactions";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

describe("TransactionService", () => {
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
      name: "Card RUB",
      type: "card",
      currency: "RUB",
      balance: 5000,
      user_id: "user-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      is_archived: false,
      icon: null,
      color: null,
    },
    {
      id: "acc-3",
      name: "Card USD",
      type: "card",
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

  describe("formatTransactionDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-03-15T12:00:00Z");
      const result = TransactionService.formatTransactionDate(date);
      expect(result).toBe("2024-03-15");
    });

    it("should pad month and day with zeros", () => {
      const date = new Date("2024-01-05T00:00:00Z");
      const result = TransactionService.formatTransactionDate(date);
      expect(result).toBe("2024-01-05");
    });

    it("should use local date, not UTC", () => {
      // Создаем дату, которая в UTC может быть другим днём
      const date = new Date(2024, 0, 15, 12, 0, 0); // 15 января 2024, 12:00 по локальному времени
      const result = TransactionService.formatTransactionDate(date);
      expect(result).toBe("2024-01-15");
    });
  });

  describe("getTransactionCurrency", () => {
    it("should return currency from account", () => {
      const result = TransactionService.getTransactionCurrency(
        mockAccounts,
        "acc-1",
        "RUB"
      );
      expect(result).toBe("RUB");
    });

    it("should return default currency if account not found", () => {
      const result = TransactionService.getTransactionCurrency(
        mockAccounts,
        "non-existent",
        "USD"
      );
      expect(result).toBe("USD");
    });

    it("should return default currency if accounts array is empty", () => {
      const result = TransactionService.getTransactionCurrency(
        [],
        "acc-1",
        "EUR"
      );
      expect(result).toBe("EUR");
    });
  });

  describe("getAvailableToAccounts", () => {
    it("should filter accounts by same currency", () => {
      const result = TransactionService.getAvailableToAccounts(
        mockAccounts,
        "acc-1"
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("acc-2");
      expect(result[0].currency).toBe("RUB");
    });

    it("should exclude source account", () => {
      const result = TransactionService.getAvailableToAccounts(
        mockAccounts,
        "acc-2"
      );
      expect(result).not.toContainEqual(
        expect.objectContaining({ id: "acc-2" })
      );
    });

    it("should return empty array if no accounts with same currency", () => {
      const result = TransactionService.getAvailableToAccounts(
        mockAccounts,
        "acc-3"
      );
      expect(result).toHaveLength(0);
    });

    it("should return empty array if source account not found", () => {
      const result = TransactionService.getAvailableToAccounts(
        mockAccounts,
        "non-existent"
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("prepareTransactionData", () => {
    const mockFormValues: TransactionFormValues = {
      amount: 100.5,
      type: "expense",
      category_id: "cat-1",
      account_id: "acc-1",
      date: new Date("2024-03-15"),
      description: "Test transaction",
    };

    it("should prepare transaction data correctly", () => {
      const result = TransactionService.prepareTransactionData(
        mockFormValues,
        mockAccounts,
        "user-1"
      );

      expect(result).toEqual({
        amount: 100.5,
        type: "expense",
        category_id: "cat-1",
        account_id: "acc-1",
        to_account_id: null,
        date: "2024-03-15",
        description: "Test transaction",
        currency: "RUB",
        user_id: "user-1",
      });
    });

    it("should set category_id to null for transfer", () => {
      const transferValues: TransactionFormValues = {
        ...mockFormValues,
        type: "transfer",
        to_account_id: "acc-2",
      };

      const result = TransactionService.prepareTransactionData(
        transferValues,
        mockAccounts,
        "user-1"
      );

      expect(result.category_id).toBeNull();
      expect(result.to_account_id).toBe("acc-2");
    });

    it("should set category_id to null if __none__", () => {
      const values: TransactionFormValues = {
        ...mockFormValues,
        category_id: "__none__",
      };

      const result = TransactionService.prepareTransactionData(
        values,
        mockAccounts,
        "user-1"
      );

      expect(result.category_id).toBeNull();
    });

    it("should handle null description", () => {
      const values: TransactionFormValues = {
        ...mockFormValues,
        description: "",
      };

      const result = TransactionService.prepareTransactionData(
        values,
        mockAccounts,
        "user-1"
      );

      expect(result.description).toBeNull();
    });
  });

  describe("getDefaultDate", () => {
    it("should return today's date with time set to start of day", () => {
      const result = TransactionService.getDefaultDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(result.getFullYear()).toBe(today.getFullYear());
      expect(result.getMonth()).toBe(today.getMonth());
      expect(result.getDate()).toBe(today.getDate());
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe("isFullTransaction", () => {
    it("should return true for full transaction with id", () => {
      const transaction: Transaction = {
        id: "trans-1",
        amount: 100,
        type: "expense",
        account_id: "acc-1",
        date: "2024-01-01",
        user_id: "user-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        category_id: null,
        to_account_id: null,
        description: null,
        currency: "RUB",
      };

      expect(TransactionService.isFullTransaction(transaction)).toBe(true);
    });

    it("should return false for partial transaction", () => {
      const partial = {
        amount: 100,
        account_id: "acc-1",
      };

      expect(TransactionService.isFullTransaction(partial)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(TransactionService.isFullTransaction(undefined)).toBe(false);
    });
  });

  describe("getInitialFormValues", () => {
    it("should return initial values from full transaction", () => {
      const transaction: Transaction = {
        id: "trans-1",
        amount: 150.75,
        type: "income",
        account_id: "acc-1",
        category_id: "cat-1",
        date: "2024-03-15",
        user_id: "user-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        to_account_id: null,
        description: "Initial description",
        currency: "RUB",
      };

      const result = TransactionService.getInitialFormValues(transaction);

      expect(result.amount).toBe(150.75);
      expect(result.type).toBe("income");
      expect(result.account_id).toBe("acc-1");
      expect(result.category_id).toBe("cat-1");
      expect(result.description).toBe("Initial description");
      expect(result.date).toBeInstanceOf(Date);
    });

    it("should return default values for empty input", () => {
      const result = TransactionService.getInitialFormValues();

      expect(result.amount).toBe(0);
      expect(result.type).toBe("expense");
      expect(result.account_id).toBe("");
      expect(result.category_id).toBe("__none__");
    });

    it("should handle partial initial data", () => {
      const partial = {
        amount: 200,
        account_id: "acc-2",
      };

      const result = TransactionService.getInitialFormValues(partial);

      expect(result.amount).toBe(200);
      expect(result.account_id).toBe("acc-2");
      expect(result.type).toBe("expense"); // default
    });
  });

  describe("getEmptyFormValues", () => {
    it("should return empty form values", () => {
      const result = TransactionService.getEmptyFormValues();

      expect(result.amount).toBe(0);
      expect(result.type).toBe("expense");
      expect(result.category_id).toBe("__none__");
      expect(result.account_id).toBe("");
      expect(result.to_account_id).toBe("");
      expect(result.description).toBe("");
      expect(result.date).toBeInstanceOf(Date);
    });
  });
});
