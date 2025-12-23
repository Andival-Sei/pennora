import { describe, it, expect } from "vitest";
import { createTransactionFormSchema } from "@/lib/validations/transactions";

describe("createTransactionFormSchema", () => {
  const mockTErrors = (key: string): string => {
    const translations: Record<string, string> = {
      "validation.transactions.amountMin": "Amount must be greater than 0",
      "validation.transactions.accountRequired": "Please select an account",
      "validation.transactions.toAccountDifferent":
        "Destination account must differ from source",
    };
    return translations[key] || key;
  };

  it("should validate valid expense transaction", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const validData = {
      amount: 100.5,
      type: "expense" as const,
      category_id: "cat-1",
      account_id: "acc-1",
      date: new Date("2024-03-15"),
      description: "Test",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it("should validate valid income transaction", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const validData = {
      amount: 500,
      type: "income" as const,
      category_id: "cat-2",
      account_id: "acc-1",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate valid transfer transaction", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const validData = {
      amount: 200,
      type: "transfer" as const,
      account_id: "acc-1",
      to_account_id: "acc-2",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject amount less than 0.01", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const invalidData = {
      amount: 0.001,
      type: "expense" as const,
      account_id: "acc-1",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Amount must be greater than 0"
      );
    }
  });

  it("should reject empty account_id", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const invalidData = {
      amount: 100,
      type: "expense" as const,
      account_id: "",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please select an account");
    }
  });

  it("should reject transfer without to_account_id", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const invalidData = {
      amount: 100,
      type: "transfer" as const,
      account_id: "acc-1",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const toAccountError = result.error.issues.find(
        (issue) => issue.path[0] === "to_account_id"
      );
      expect(toAccountError?.message).toBe(
        "Destination account must differ from source"
      );
    }
  });

  it("should reject transfer with same source and destination", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const invalidData = {
      amount: 100,
      type: "transfer" as const,
      account_id: "acc-1",
      to_account_id: "acc-1",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const toAccountError = result.error.issues.find(
        (issue) => issue.path[0] === "to_account_id"
      );
      expect(toAccountError?.message).toBe(
        "Destination account must differ from source"
      );
    }
  });

  it("should allow __none__ for category_id", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const validData = {
      amount: 100,
      type: "expense" as const,
      category_id: "__none__" as const,
      account_id: "acc-1",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should allow optional description", () => {
    const schema = createTransactionFormSchema(mockTErrors);
    const validData = {
      amount: 100,
      type: "expense" as const,
      account_id: "acc-1",
      date: new Date("2024-03-15"),
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
