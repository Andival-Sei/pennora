/**
 * Утилиты для мокирования Supabase клиента в performance-тестах
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface MockSupabaseOptions {
  user?: {
    id: string;
    email: string;
  } | null;
  delay?: number; // Имитация сетевой задержки в мс
}

/**
 * Создает мок Supabase клиента для тестирования производительности
 */
export function createMockSupabaseClient(
  options: MockSupabaseOptions = {}
): Partial<SupabaseClient> {
  const { user, delay = 0 } = options;

  const delayPromise = () =>
    delay > 0
      ? new Promise((resolve) => setTimeout(resolve, delay))
      : Promise.resolve();

  return {
    auth: {
      getUser: async () => {
        await delayPromise();
        return {
          data: {
            user: user
              ? {
                  id: user.id,
                  email: user.email,
                  aud: "authenticated",
                  role: "authenticated",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  app_metadata: {},
                  user_metadata: {},
                  identities: [],
                }
              : null,
          },
          error: null,
        };
      },
      getSession: async () => {
        await delayPromise();
        return {
          data: {
            session: user
              ? {
                  access_token: "mock-token",
                  refresh_token: "mock-refresh",
                  expires_in: 3600,
                  expires_at: Date.now() / 1000 + 3600,
                  token_type: "bearer",
                  user: {
                    id: user.id,
                    email: user.email,
                    aud: "authenticated",
                    role: "authenticated",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    app_metadata: {},
                    user_metadata: {},
                    identities: [],
                  },
                }
              : null,
          },
          error: null,
        };
      },
    } as {
      auth: {
        getUser: () => Promise<{
          data: { user: { id: string; email: string } | null };
        }>;
        getSession: () => Promise<{
          data: {
            session: {
              access_token: string;
              refresh_token: string;
              expires_in: number;
              expires_at: number;
              token_type: string;
              user: { id: string; email: string };
            } | null;
          };
        }>;
      };
    },
  };
}
