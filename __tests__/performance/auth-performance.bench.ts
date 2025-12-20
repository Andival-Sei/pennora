/**
 * Performance тесты для сравнения getUser() vs getSession()
 */

import { bench, describe } from "vitest";
import { createMockSupabaseClient } from "./utils/supabase-mock";

describe("Auth Performance", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

  describe("getUser() vs getSession()", () => {
    // Имитируем сетевую задержку для getUser() (реальный запрос к Supabase)
    const getUserClient = createMockSupabaseClient({
      user: mockUser,
      delay: 100, // ~100ms как в реальном сценарии
    }) as {
      auth: {
        getUser: () => Promise<{ data: { user: typeof mockUser | null } }>;
      };
    };

    // getSession() работает локально без задержки
    const getSessionClient = createMockSupabaseClient({
      user: mockUser,
      delay: 0, // Локальная проверка JWT
    }) as {
      auth: {
        getSession: () => Promise<{
          data: {
            session: { user: typeof mockUser } | null;
          };
        }>;
      };
    };

    bench(
      "getUser() - с сетевой задержкой",
      async () => {
        await getUserClient.auth.getUser();
      },
      {
        time: 1000,
        iterations: 10,
      }
    );

    bench(
      "getSession() - локальная проверка",
      async () => {
        await getSessionClient.auth.getSession();
      },
      {
        time: 1000,
        iterations: 10,
      }
    );
  });
});
