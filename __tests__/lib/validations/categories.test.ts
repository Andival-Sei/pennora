import { describe, it, expect } from "vitest";
import { createCategoryFormSchema } from "@/lib/validations/categories";

describe("createCategoryFormSchema", () => {
  const mockT = (key: string): string => {
    const translations: Record<string, string> = {
      "categories.nameRequired": "Название категории обязательно",
      "categories.nameMaxLength":
        "Название категории не должно превышать 50 символов",
    };
    return translations[key] || key;
  };

  it("should validate valid category with all fields", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Продукты",
      type: "expense" as const,
      parent_id: "cat-1",
      icon: "ShoppingCart",
      color: "#10b981",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it("should validate valid category with minimal fields", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Зарплата",
      type: "income" as const,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Зарплата");
      expect(result.data.type).toBe("income");
      expect(result.data.parent_id).toBeUndefined();
      expect(result.data.icon).toBeUndefined();
      expect(result.data.color).toBeUndefined();
    }
  });

  it("should validate category with null optional fields", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Транспорт",
      type: "expense" as const,
      parent_id: null,
      icon: null,
      color: null,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const schema = createCategoryFormSchema(mockT);
    const invalidData = {
      name: "",
      type: "expense" as const,
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Название категории обязательно"
      );
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  it("should reject name longer than 50 characters", () => {
    const schema = createCategoryFormSchema(mockT);
    const invalidData = {
      name: "А".repeat(51), // 51 символ
      type: "expense" as const,
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Название категории не должно превышать 50 символов"
      );
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  it("should accept name with exactly 50 characters", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "А".repeat(50), // Ровно 50 символов
      type: "expense" as const,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate income type", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Доход",
      type: "income" as const,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("income");
    }
  });

  it("should validate expense type", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Расход",
      type: "expense" as const,
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("expense");
    }
  });

  it("should reject invalid type", () => {
    const schema = createCategoryFormSchema(mockT);
    const invalidData = {
      name: "Категория",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: "invalid" as any, // Невалидный тип
    };

    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["type"]);
    }
  });

  it("should accept optional parent_id", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Подкатегория",
      type: "expense" as const,
      parent_id: "parent-cat-1",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parent_id).toBe("parent-cat-1");
    }
  });

  it("should accept optional icon", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Категория с иконкой",
      type: "expense" as const,
      icon: "Home",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.icon).toBe("Home");
    }
  });

  it("should accept optional color", () => {
    const schema = createCategoryFormSchema(mockT);
    const validData = {
      name: "Категория с цветом",
      type: "expense" as const,
      color: "#ef4444",
    };

    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("#ef4444");
    }
  });
});
