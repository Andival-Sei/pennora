import { describe, it, expect } from "vitest";
import {
  QUERY_STALE_TIME,
  QUERY_GC_TIME,
  QUERY_RETRY,
} from "@/lib/constants/query";

describe("Query Constants", () => {
  describe("QUERY_STALE_TIME", () => {
    it("должен содержать правильные значения для транзакций", () => {
      expect(QUERY_STALE_TIME.TRANSACTIONS).toBe(2 * 60 * 1000); // 2 минуты
    });

    it("должен содержать правильные значения для категорий", () => {
      expect(QUERY_STALE_TIME.CATEGORIES).toBe(10 * 60 * 1000); // 10 минут
    });

    it("должен содержать правильные значения для счетов", () => {
      expect(QUERY_STALE_TIME.ACCOUNTS).toBe(10 * 60 * 1000); // 10 минут
    });

    it("должен содержать значение по умолчанию", () => {
      expect(QUERY_STALE_TIME.DEFAULT).toBe(5 * 60 * 1000); // 5 минут
    });
  });

  describe("QUERY_GC_TIME", () => {
    it("должен содержать правильные значения для транзакций", () => {
      expect(QUERY_GC_TIME.TRANSACTIONS).toBe(15 * 60 * 1000); // 15 минут
    });

    it("должен содержать правильные значения для категорий", () => {
      expect(QUERY_GC_TIME.CATEGORIES).toBe(24 * 60 * 60 * 1000); // 24 часа
    });

    it("должен содержать значение по умолчанию", () => {
      expect(QUERY_GC_TIME.DEFAULT).toBe(30 * 60 * 1000); // 30 минут
    });
  });

  describe("QUERY_RETRY", () => {
    it("должен содержать правильное значение для queries", () => {
      expect(QUERY_RETRY.QUERIES).toBe(2);
    });

    it("должен содержать правильное значение для mutations", () => {
      expect(QUERY_RETRY.MUTATIONS).toBe(1);
    });
  });
});
