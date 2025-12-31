import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // По умолчанию используем jsdom для тестирования React компонентов
    // Для тестов сервисов/утилит можно использовать комментарий: // @vitest-environment node
    environment: "jsdom",
    setupFiles: ["./__tests__/setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "**/__tests__/**",
        "**/*.test.*",
        "**/*.spec.*",
        "coverage/**",
        ".eslintrc.cjs",
        "next-env.d.ts",
        "app/**/layout.tsx", // Исключаем layout файлы (обычно простые обертки)
        "app/**/loading.tsx", // Исключаем loading компоненты
        "app/**/error.tsx", // Исключаем error компоненты
        "middleware.ts", // Исключаем middleware (сложно тестировать)
        "i18n.ts", // Исключаем i18n конфигурацию
      ],
      thresholds: {
        // Текущие пороги (2025-12-30): начинаем с 25%, цель - 70%
        // Постепенно повышаем пороги по мере добавления тестов
        lines: 25,
        functions: 25,
        branches: 20,
        statements: 25,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
