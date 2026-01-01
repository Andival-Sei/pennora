/**
 * Общие моки для Supabase client
 * Переиспользуются в тестах мутаций (accounts, categories, transactions)
 */
import { vi, type Mock } from "vitest";

/**
 * Создаёт мок Supabase client с настраиваемым поведением
 */
export function createMockSupabaseClient() {
  const mockEq = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockMatch = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockOrder = vi.fn(() => ({
    eq: mockEq,
    match: mockMatch,
  }));
  const mockSelect = vi.fn(() => ({
    eq: mockEq,
    order: mockOrder,
    match: mockMatch,
  }));
  const mockInsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  }));
  const mockUpdate = vi.fn(() => ({
    eq: mockEq,
    match: mockMatch,
  }));
  const mockDelete = vi.fn(() => ({
    eq: mockEq,
    match: mockMatch,
  }));
  const mockUpsert = vi.fn(() => Promise.resolve({ data: null, error: null }));

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockUpsert,
  }));

  const client = {
    from: mockFrom,
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
    },
  };

  return {
    client,
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockUpsert,
    mockEq,
    mockMatch,
    mockOrder,
  };
}

/**
 * Настраивает мок insert для возврата данных
 */
export function setupInsertSuccess<T>(mockInsert: Mock, data: T) {
  mockInsert.mockReturnValue({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data, error: null })),
    })),
  });
}

/**
 * Настраивает мок insert для возврата ошибки
 */
export function setupInsertError(
  mockInsert: Mock,
  error: { message: string; code?: string }
) {
  mockInsert.mockReturnValue({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error })),
    })),
  });
}

/**
 * Настраивает мок update для успешного обновления
 */
export function setupUpdateSuccess<T>(mockUpdate: Mock, mockEq: Mock, data: T) {
  mockEq.mockResolvedValue({ data, error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

/**
 * Настраивает мок update для ошибки
 */
export function setupUpdateError(
  mockUpdate: Mock,
  mockEq: Mock,
  error: { message: string; code?: string }
) {
  mockEq.mockResolvedValue({ data: null, error });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

/**
 * Настраивает мок delete для успешного удаления
 * eslint-disable-next-line @typescript-eslint/no-explicit-any - тестовые утилиты
 */
export function setupDeleteSuccess(
  mockDelete: { mockReturnValue: (val: unknown) => void },
  mockEq: { mockResolvedValue: (val: unknown) => void }
) {
  mockEq.mockResolvedValue({ data: null, error: null });
  mockDelete.mockReturnValue({ eq: mockEq });
}

/**
 * Настраивает мок delete для ошибки
 */
export function setupDeleteError(
  mockDelete: { mockReturnValue: (val: unknown) => void },
  mockEq: { mockResolvedValue: (val: unknown) => void },
  error: { message: string; code?: string }
) {
  mockEq.mockResolvedValue({ data: null, error });
  mockDelete.mockReturnValue({ eq: mockEq });
}

/**
 * Фабрика мока Supabase для vi.mock
 */
export const supabaseMockFactory = () => {
  const { client } = createMockSupabaseClient();
  return {
    createClient: vi.fn(() => client),
  };
};
