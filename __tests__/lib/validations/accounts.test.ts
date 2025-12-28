import { describe, it, expect } from "vitest";
import {
  createCurrencySchema,
  createCardAccountSchema,
  createCashAccountSchema,
  createAccountSchema,
} from "@/lib/validations/accounts";

describe("createCurrencySchema", () => {
  it("should validate RUB currency", () => {
    const schema = createCurrencySchema();
    const validData = {
      currency: "RUB" as const,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("RUB");
    }
  });

  it("should validate USD currency", () => {
    const schema = createCurrencySchema();
    const validData = {
      currency: "USD" as const,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });

  it("should validate EUR currency", () => {
    const schema = createCurrencySchema();
    const validData = {
      currency: "EUR" as const,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("EUR");
    }
  });

  it("should reject invalid currency", () => {
    const schema = createCurrencySchema();
    const invalidData = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currency: "GBP" as any, // Неподдерживаемая валюта
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["currency"]);
    }
  });
});

describe("createCardAccountSchema", () => {
  const mockT = (key: string): string => {
    const translations: Record<string, string> = {
      "card.bankRequired": "Название банка обязательно",
      "card.nameRequired": "Название карты обязательно",
      "card.balanceInvalid": "Неверный формат баланса",
    };
    return translations[key] || key;
  };

  it("should validate valid card account", () => {
    const schema = createCardAccountSchema(mockT);
    const validData = {
      bank: "Сбербанк",
      name: "Основная карта",
      balance: "10000.50",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bank).toBe("Сбербанк");
      expect(result.data.name).toBe("Основная карта");
      expect(result.data.balance).toBe("10000.50");
    }
  });

  it("should accept balance with comma as decimal separator", () => {
    const schema = createCardAccountSchema(mockT);
    const validData = {
      bank: "ВТБ",
      name: "Карта",
      balance: "5000,75",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept zero balance", () => {
    const schema = createCardAccountSchema(mockT);
    const validData = {
      bank: "Альфа-Банк",
      name: "Новая карта",
      balance: "0",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject empty bank", () => {
    const schema = createCardAccountSchema(mockT);
    const invalidData = {
      bank: "",
      name: "Карта",
      balance: "1000",
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Название банка обязательно");
      expect(result.error.issues[0].path).toEqual(["bank"]);
    }
  });

  it("should reject empty name", () => {
    const schema = createCardAccountSchema(mockT);
    const invalidData = {
      bank: "Сбербанк",
      name: "",
      balance: "1000",
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Название карты обязательно");
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  it("should reject negative balance", () => {
    const schema = createCardAccountSchema(mockT);
    const invalidData = {
      bank: "Сбербанк",
      name: "Карта",
      balance: "-1000",
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Неверный формат баланса");
      expect(result.error.issues[0].path).toEqual(["balance"]);
    }
  });

  it("should reject invalid balance format", () => {
    const schema = createCardAccountSchema(mockT);
    const invalidData = {
      bank: "Сбербанк",
      name: "Карта",
      balance: "not-a-number",
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Неверный формат баланса");
    }
  });
});

describe("createCashAccountSchema", () => {
  const mockT = (key: string): string => {
    const translations: Record<string, string> = {
      "cash.balanceInvalid": "Неверный формат баланса",
    };
    return translations[key] || key;
  };

  it("should validate valid cash account", () => {
    const schema = createCashAccountSchema(mockT);
    const validData = {
      balance: "5000.50",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.balance).toBe("5000.50");
    }
  });

  it("should accept balance with comma as decimal separator", () => {
    const schema = createCashAccountSchema(mockT);
    const validData = {
      balance: "3000,25",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept zero balance", () => {
    const schema = createCashAccountSchema(mockT);
    const validData = {
      balance: "0",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject negative balance", () => {
    const schema = createCashAccountSchema(mockT);
    const invalidData = {
      balance: "-500",
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Неверный формат баланса");
      expect(result.error.issues[0].path).toEqual(["balance"]);
    }
  });

  it("should reject invalid balance format", () => {
    const schema = createCashAccountSchema(mockT);
    const invalidData = {
      balance: "invalid",
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Неверный формат баланса");
    }
  });
});

describe("createAccountSchema", () => {
  it("should validate card account", () => {
    const schema = createAccountSchema();
    const validData = {
      name: "Основная карта",
      type: "card" as const,
      currency: "RUB" as const,
      balance: 10000.5,
      bank: "Сбербанк",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("card");
      expect(result.data.bank).toBe("Сбербанк");
    }
  });

  it("should validate cash account", () => {
    const schema = createAccountSchema();
    const validData = {
      name: "Наличные",
      type: "cash" as const,
      currency: "RUB" as const,
      balance: 5000,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("cash");
    }
  });

  it("should validate savings account", () => {
    const schema = createAccountSchema();
    const validData = {
      name: "Накопительный счёт",
      type: "savings" as const,
      currency: "USD" as const,
      balance: 2000,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("savings");
    }
  });

  it("should accept optional bank field", () => {
    const schema = createAccountSchema();
    const validData = {
      name: "Карта",
      type: "card" as const,
      currency: "RUB" as const,
      balance: 1000,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bank).toBeUndefined();
    }
  });

  it("should reject empty name", () => {
    const schema = createAccountSchema();
    const invalidData = {
      name: "",
      type: "card" as const,
      currency: "RUB" as const,
      balance: 1000,
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  it("should reject negative balance", () => {
    const schema = createAccountSchema();
    const invalidData = {
      name: "Карта",
      type: "card" as const,
      currency: "RUB" as const,
      balance: -100,
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["balance"]);
    }
  });

  it("should accept zero balance", () => {
    const schema = createAccountSchema();
    const validData = {
      name: "Карта",
      type: "card" as const,
      currency: "RUB" as const,
      balance: 0,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid type", () => {
    const schema = createAccountSchema();
    const invalidData = {
      name: "Счёт",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "invalid" as any,
      currency: "RUB" as const,
      balance: 1000,
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["type"]);
    }
  });

  it("should reject invalid currency", () => {
    const schema = createAccountSchema();
    const invalidData = {
      name: "Карта",
      type: "card" as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currency: "GBP" as any,
      balance: 1000,
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["currency"]);
    }
  });
});
