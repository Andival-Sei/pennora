// @vitest-environment jsdom
/**
 * Тесты для мутаций категорий
 * Покрывает: useCreateCategory, useUpdateCategory, useDeleteCategory
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { Category } from "@/lib/types/category";

// Мок функции
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockEnqueue = vi.fn();
const mockInvalidateCategoryRelated = vi.fn();
const mockGetClientUser = vi.fn();
const mockIsNetworkError = vi.fn();
const mockGetErrorMessage = vi.fn();

// Мок результаты Supabase
let mockSelectResult = {
  data: null as Category | null,
  error: null as Error | null,
};
let mockInsertResult = {
  data: null as Category | null,
  error: null as Error | null,
};
let mockUpdateResult = {
  data: null as Category | null,
  error: null as Error | null,
};
let mockDeleteCheckResult: {
  data: { is_system: boolean } | null;
  error: Error | null;
} = {
  data: { is_system: false },
  error: null,
};

// Мок Supabase client
const mockSingleForSelect = vi.fn(() => Promise.resolve(mockSelectResult));
const mockLimitForSelect = vi.fn(() => ({ single: mockSingleForSelect }));
const mockOrderForSelect = vi.fn(() => ({ limit: mockLimitForSelect }));
const mockEqForSortOrder = vi.fn(() => ({ order: mockOrderForSelect }));

const mockSingleForInsert = vi.fn(() => Promise.resolve(mockInsertResult));
const mockSelectAfterInsert = vi.fn(() => ({ single: mockSingleForInsert }));
const mockInsert = vi.fn(() => ({ select: mockSelectAfterInsert }));

const mockSingleForUpdate = vi.fn(() => Promise.resolve(mockUpdateResult));
const mockSelectAfterUpdate = vi.fn(() => ({ single: mockSingleForUpdate }));

const mockFrom = vi.fn((table: string) => {
  if (table === "categories") {
    return {
      select: vi.fn(() => ({
        eq: mockEqForSortOrder,
        single: vi.fn(() => Promise.resolve(mockDeleteCheckResult)),
      })),
      insert: mockInsert,
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: mockSelectAfterUpdate,
          })),
        })),
      })),
    };
  }
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
});

vi.mock("@/lib/db/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock("@/lib/db/supabase/auth-client", () => ({
  getClientUser: () => mockGetClientUser(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/query/keys", () => ({
  queryKeys: {
    categories: {
      all: ["categories"],
      list: () => ["categories", "list"],
    },
  },
}));

vi.mock("@/lib/query/invalidation", () => ({
  invalidateCategoryRelated: (...args: unknown[]) =>
    mockInvalidateCategoryRelated(...args),
}));

vi.mock("@/lib/sync/queueManager", () => ({
  queueManager: {
    enqueue: (...args: unknown[]) => mockEnqueue(...args),
  },
}));

vi.mock("@/lib/utils/network", () => ({
  isNetworkError: (err: unknown) => mockIsNetworkError(err),
}));

vi.mock("@/lib/utils/errorHandler", () => ({
  getErrorMessage: (err: unknown, t: unknown) => mockGetErrorMessage(err, t),
}));

// Импортируем после моков
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/query/mutations/categories";
import { createQueryWrapper } from "@/__tests__/mocks/query-client";

// Хелпер для создания тестовой категории
function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-123",
    user_id: "user-123",
    name: "Test Category",
    type: "expense",
    icon: "shopping-cart",
    color: "#FF5733",
    parent_id: null,
    sort_order: 1,
    is_archived: false,
    is_system: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Category Mutations", () => {
  let wrapper: React.ComponentType<{ children: React.ReactNode }>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Настройка по умолчанию
    mockGetClientUser.mockResolvedValue({ id: "user-123" });
    mockIsNetworkError.mockReturnValue(false);
    mockGetErrorMessage.mockImplementation(
      (err) => (err as Error)?.message || "Unknown error"
    );
    mockEnqueue.mockResolvedValue("queue-id");

    // Сброс результатов Supabase
    mockSelectResult = { data: null, error: null };
    mockInsertResult = { data: null, error: null };
    mockUpdateResult = { data: null, error: null };
    mockDeleteCheckResult = { data: { is_system: false }, error: null };

    const { Wrapper } = createQueryWrapper();
    wrapper = Wrapper;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useCreateCategory", () => {
    it("создаёт категорию успешно", async () => {
      const newCategory = createMockCategory();
      mockInsertResult = { data: newCategory, error: null };
      mockSingleForInsert.mockResolvedValue(mockInsertResult);

      // Мок для получения max sort_order
      mockSingleForSelect.mockResolvedValue({
        data: { sort_order: 5 } as unknown as Category,
        error: null,
      });

      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "New Category",
          type: "expense",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "categories.success.created"
      );
      expect(mockInvalidateCategoryRelated).toHaveBeenCalled();
    });

    it("показывает ошибку при неавторизованном пользователе", async () => {
      mockGetClientUser.mockResolvedValue(null);

      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "New Category",
          type: "expense",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalled();
    });

    // TODO: Требуется исправить мок для правильного форматирования данных enqueue
    it.skip("добавляет в очередь при сетевой ошибке", async () => {
      const networkError = new Error("Network error");
      mockInsertResult = { data: null, error: networkError };
      mockSingleForInsert.mockResolvedValue(mockInsertResult);
      mockIsNetworkError.mockReturnValue(true);

      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "New Category",
          type: "expense",
        });
      });

      await waitFor(() => {
        expect(mockEnqueue).toHaveBeenCalledWith(
          "categories",
          "create",
          null,
          expect.objectContaining({ name: "New Category" })
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("changesWillSync");
    });
  });

  describe("useUpdateCategory", () => {
    it("обновляет категорию успешно", async () => {
      const updatedCategory = createMockCategory({ name: "Updated Category" });
      mockUpdateResult = { data: updatedCategory, error: null };
      mockSingleForUpdate.mockResolvedValue(mockUpdateResult);

      const { result } = renderHook(() => useUpdateCategory(), { wrapper });

      await act(async () => {
        result.current.mutate({
          id: "cat-123",
          updates: { name: "Updated Category" },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "categories.success.updated"
      );
      expect(mockInvalidateCategoryRelated).toHaveBeenCalled();
    });

    it("добавляет в очередь при сетевой ошибке", async () => {
      const networkError = new Error("Network error");
      mockUpdateResult = { data: null, error: networkError };
      mockSingleForUpdate.mockResolvedValue(mockUpdateResult);
      mockIsNetworkError.mockReturnValue(true);

      const { result } = renderHook(() => useUpdateCategory(), { wrapper });

      await act(async () => {
        result.current.mutate({
          id: "cat-123",
          updates: { name: "Updated Category" },
        });
      });

      await waitFor(() => {
        expect(mockEnqueue).toHaveBeenCalledWith(
          "categories",
          "update",
          "cat-123",
          { name: "Updated Category" }
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("changesWillSync");
    });
  });

  describe("useDeleteCategory", () => {
    // TODO: Требуется исправить мок для цепочки select().eq().eq()
    it.skip("удаляет (архивирует) обычную категорию успешно", async () => {
      // Категория не системная
      mockDeleteCheckResult = { data: { is_system: false }, error: null };

      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      await act(async () => {
        result.current.mutate("cat-123");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "categories.success.deleted"
      );
      expect(mockInvalidateCategoryRelated).toHaveBeenCalled();
    });

    it("показывает ошибку при попытке удалить системную категорию", async () => {
      // Категория системная
      mockDeleteCheckResult = { data: { is_system: true }, error: null };
      mockGetErrorMessage.mockReturnValue(
        "categories.errors.cannotDeleteSystem"
      );

      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      await act(async () => {
        result.current.mutate("cat-system");
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalled();
    });

    // TODO: Требуется исправить мок для цепочки select().eq().eq()
    it.skip("добавляет в очередь при сетевой ошибке", async () => {
      const networkError = new Error("Network error");
      mockDeleteCheckResult = { data: null, error: networkError };
      mockIsNetworkError.mockReturnValue(true);

      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      await act(async () => {
        result.current.mutate("cat-123");
      });

      await waitFor(() => {
        expect(mockEnqueue).toHaveBeenCalledWith(
          "categories",
          "delete",
          "cat-123",
          null
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("changesWillSync");
    });

    it("показывает ошибку при не-сетевой ошибке БД", async () => {
      const dbError = new Error("Database error");
      mockDeleteCheckResult = { data: null, error: dbError };
      mockIsNetworkError.mockReturnValue(false);
      mockGetErrorMessage.mockReturnValue("Database error");

      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      await act(async () => {
        result.current.mutate("cat-123");
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith("Database error");
    });
  });
});
