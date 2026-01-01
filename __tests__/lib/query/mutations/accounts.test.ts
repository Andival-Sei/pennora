// @vitest-environment jsdom
/**
 * Тесты для мутаций счетов
 * Покрывает: useCreateAccount, useUpdateAccount, useDeleteAccount
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { Database } from "@/lib/db/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

// Мок функции и переменные
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockEnqueue = vi.fn();
const mockInvalidateAccountRelated = vi.fn();
const mockGetClientUser = vi.fn();
const mockIsNetworkError = vi.fn();
const mockGetErrorMessage = vi.fn();

// Мок Supabase client
let mockInsertResult = {
  data: null as Account | null,
  error: null as Error | null,
};
let mockUpdateResult = {
  data: null as Account | null,
  error: null as Error | null,
};
let mockDeleteResult = { error: null as Error | null };

const mockSingle = vi.fn(() => Promise.resolve(mockInsertResult));
const mockSelectAfterInsert = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelectAfterInsert }));

const mockSelectAfterUpdate = vi.fn(() => ({
  single: vi.fn(() => Promise.resolve(mockUpdateResult)),
}));
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn(() => ({
      select: mockSelectAfterUpdate,
    })),
  })),
}));

const mockDelete = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve(mockDeleteResult)),
  })),
}));

const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

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
    accounts: {
      all: ["accounts"],
      list: () => ["accounts", "list"],
    },
  },
}));

vi.mock("@/lib/query/invalidation", () => ({
  invalidateAccountRelated: (...args: unknown[]) =>
    mockInvalidateAccountRelated(...args),
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
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/lib/query/mutations/accounts";
import { createQueryWrapper } from "@/__tests__/mocks/query-client";

// Хелпер для создания тестового счёта
function createMockAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "acc-123",
    user_id: "user-123",
    name: "Test Account",
    type: "card",
    currency: "RUB",
    balance: 1000,
    icon: null,
    color: null,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Account Mutations", () => {
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
    mockInsertResult = { data: null, error: null };
    mockUpdateResult = { data: null, error: null };
    mockDeleteResult = { error: null };

    const { Wrapper } = createQueryWrapper();
    wrapper = Wrapper;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useCreateAccount", () => {
    it("создаёт счёт успешно", async () => {
      const newAccount = createMockAccount();
      mockInsertResult = { data: newAccount, error: null };
      mockSingle.mockResolvedValue(mockInsertResult);

      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "New Account",
          type: "card",
          currency: "RUB",
          balance: 500,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("accounts.success.created");
      expect(mockInvalidateAccountRelated).toHaveBeenCalled();
    });

    it("показывает ошибку при неавторизованном пользователе", async () => {
      mockGetClientUser.mockResolvedValue(null);

      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "New Account",
          type: "card",
          currency: "RUB",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalled();
    });

    it("добавляет в очередь при сетевой ошибке", async () => {
      const networkError = new Error("Network error");
      mockInsertResult = { data: null, error: networkError };
      mockSingle.mockResolvedValue(mockInsertResult);
      mockIsNetworkError.mockReturnValue(true);

      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "New Account",
          type: "card",
          currency: "RUB",
        });
      });

      await waitFor(() => {
        expect(mockEnqueue).toHaveBeenCalledWith(
          "accounts",
          "create",
          null,
          expect.objectContaining({ name: "New Account" })
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("changesWillSync");
    });

    it("показывает ошибку при не-сетевой ошибке", async () => {
      const dbError = new Error("Database error");
      mockInsertResult = { data: null, error: dbError };
      mockSingle.mockResolvedValue(mockInsertResult);
      mockIsNetworkError.mockReturnValue(false);
      mockGetErrorMessage.mockReturnValue("Database error");

      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      await act(async () => {
        result.current.mutate({
          name: "New Account",
          type: "card",
          currency: "RUB",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith("Database error");
    });
  });

  describe("useUpdateAccount", () => {
    it("обновляет счёт успешно", async () => {
      const updatedAccount = createMockAccount({ name: "Updated Account" });
      mockUpdateResult = { data: updatedAccount, error: null };

      // Настраиваем mock chain для update
      const mockUpdateChain = {
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve(mockUpdateResult)),
            })),
          })),
        })),
      };
      mockUpdate.mockReturnValue(mockUpdateChain);

      const { result } = renderHook(() => useUpdateAccount(), { wrapper });

      await act(async () => {
        result.current.mutate({
          id: "acc-123",
          updates: { name: "Updated Account" },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("accounts.success.updated");
      expect(mockInvalidateAccountRelated).toHaveBeenCalled();
    });

    it("добавляет в очередь при сетевой ошибке", async () => {
      const networkError = new Error("Network error");
      mockIsNetworkError.mockReturnValue(true);

      // Настраиваем mock chain для ошибки
      const mockUpdateChain = {
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: networkError })
              ),
            })),
          })),
        })),
      };
      mockUpdate.mockReturnValue(mockUpdateChain);

      const { result } = renderHook(() => useUpdateAccount(), { wrapper });

      await act(async () => {
        result.current.mutate({
          id: "acc-123",
          updates: { name: "Updated Account" },
        });
      });

      await waitFor(() => {
        expect(mockEnqueue).toHaveBeenCalledWith(
          "accounts",
          "update",
          "acc-123",
          { name: "Updated Account" }
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("changesWillSync");
    });
  });

  describe("useDeleteAccount", () => {
    it("удаляет (архивирует) счёт успешно", async () => {
      mockDeleteResult = { error: null };

      // Настраиваем mock chain для delete (который на самом деле update с is_archived)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockUpdate as any).mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      });

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        result.current.mutate("acc-123");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("accounts.success.deleted");
      expect(mockInvalidateAccountRelated).toHaveBeenCalled();
    });

    it("добавляет в очередь при сетевой ошибке", async () => {
      const networkError = new Error("Network error");
      mockIsNetworkError.mockReturnValue(true);

      // Настраиваем mock chain для ошибки
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockUpdate as any).mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: networkError })),
        })),
      });

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        result.current.mutate("acc-123");
      });

      await waitFor(() => {
        expect(mockEnqueue).toHaveBeenCalledWith(
          "accounts",
          "delete",
          "acc-123",
          null
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("changesWillSync");
    });

    it("показывает ошибку при не-сетевой ошибке", async () => {
      const dbError = new Error("Database error");
      mockIsNetworkError.mockReturnValue(false);
      mockGetErrorMessage.mockReturnValue("Database error");

      // Настраиваем mock chain для ошибки
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockUpdate as any).mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: dbError })),
        })),
      });

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        result.current.mutate("acc-123");
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToastError).toHaveBeenCalledWith("Database error");
    });
  });
});
