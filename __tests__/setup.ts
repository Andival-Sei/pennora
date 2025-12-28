import "@testing-library/jest-dom";
import { vi } from "vitest";

// Мокируем localStorage для jsdom
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.localStorage = localStorageMock as any;

// Мокируем window.matchMedia для тестов (только в браузерном окружении)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Мокируем next/navigation для тестов
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Мокируем next-intl для тестов
// Удаляем глобальный мок, так как мы используем NextIntlClientProvider в test-utils.tsx
// vi.mock("next-intl", async () => {
//   const actual = await vi.importActual("next-intl");
//   return {
//     ...actual,
//     useTranslations: () => (key: string) => key,
//     useLocale: () => "ru",
//   };
// });

// Мокируем sonner для тестов
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Мокируем framer-motion для тестов (упрощаем анимации)
vi.mock("framer-motion", async () => {
  const React = await import("react");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await vi.importActual<any>("framer-motion");
  return {
    ...actual,
    motion: {
      // eslint-disable-next-line react/display-name
      div: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement>
      >((props, ref) => React.createElement("div", { ...props, ref })),
      // eslint-disable-next-line react/display-name
      button: React.forwardRef<
        HTMLButtonElement,
        React.ButtonHTMLAttributes<HTMLButtonElement>
      >((props, ref) => React.createElement("button", { ...props, ref })),
      // eslint-disable-next-line react/display-name
      span: React.forwardRef<
        HTMLSpanElement,
        React.HTMLAttributes<HTMLSpanElement>
      >((props, ref) => React.createElement("span", { ...props, ref })),
    },

    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});
