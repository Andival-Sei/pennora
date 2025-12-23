import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  waitFor,
  userEvent,
} from "../../utils/test-utils";
import { LoginPageClient } from "@/app/(auth)/login/login-page-client";

// Мокируем server actions
vi.mock("@/app/(auth)/actions", () => ({
  signIn: vi.fn(),
}));

// Мокируем компоненты
vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

vi.mock("@/components/locale-toggle", () => ({
  LocaleToggle: () => <div data-testid="locale-toggle">Locale Toggle</div>,
}));

vi.mock("@/components/ui/google-button", () => ({
  GoogleButton: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <button className={className} data-testid="google-button">
      {children}
    </button>
  ),
}));

vi.mock("@/components/motion", () => ({
  FadeIn: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/password-input", () => ({
  PasswordInput: React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<"input"> & {
      showStrengthIndicator?: boolean;
      strengthLabels?: Record<string, string>;
      requirementLabels?: Record<string, string>;
    }
  >(function PasswordInputMock(props, ref) {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      showStrengthIndicator,
      strengthLabels,
      requirementLabels,
      ...inputProps
    } = props;
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return (
      <input
        {...inputProps}
        type="password"
        ref={ref}
        data-testid="password-input"
      />
    );
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn((key: string) => (key === "redirect" ? null : null)),
  })),
}));

import * as authActions from "@/app/(auth)/actions";
import { useSearchParams } from "next/navigation";

describe("LoginPageClient", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockSignIn = vi.mocked(authActions.signIn) as any;
  const mockUseSearchParams = vi.mocked(useSearchParams);

  beforeEach(() => {
    vi.clearAllMocks();
    // Сбрасываем searchParams на дефолтное значение
    mockUseSearchParams.mockReturnValue({
      get: vi.fn((key: string) => (key === "redirect" ? null : null)),
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  describe("рендеринг", () => {
    it("должен рендерить форму с полями", async () => {
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it("должен рендерить кнопку отправки", async () => {
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /login\.submit/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("валидация", () => {
    it("должен блокировать кнопку отправки при пустой форме", async () => {
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /login\.submit/i,
        });
        expect(submitButton).toBeDisabled();
      });
    });

    it("должен разблокировать кнопку при валидной форме", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /login\.submit/i,
        });
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("отправка формы", () => {
    it("должен отправлять форму с валидными данными", async () => {
      mockSignIn.mockResolvedValue(undefined); // signIn делает redirect, поэтому возвращает undefined

      const user = userEvent.setup();
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      const submitButton = screen.getByRole("button", {
        name: /login\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(1);
      });

      // Проверяем, что signIn был вызван с правильными данными
      const formData = mockSignIn.mock.calls[0][0] as FormData;
      expect(formData.get("email")).toBe("test@example.com");
      expect(formData.get("password")).toBe("password123");
    });

    it("должен показывать ошибку сервера при неудачном входе", async () => {
      mockSignIn.mockResolvedValue({
        error: "errors.invalidCredentials",
      });

      const user = userEvent.setup();
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");

      const submitButton = screen.getByRole("button", {
        name: /login\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/errors\.invalidCredentials/i)
        ).toBeInTheDocument();
      });
    });

    it("должен передавать redirect параметр в форму", async () => {
      mockSignIn.mockResolvedValue(undefined);

      // Мокируем searchParams с redirect
      mockUseSearchParams.mockReturnValue({
        get: vi.fn((key: string) =>
          key === "redirect" ? "/dashboard/transactions" : null
        ),
      } as unknown as ReturnType<typeof useSearchParams>);

      const user = userEvent.setup();
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      const submitButton = screen.getByRole("button", {
        name: /login\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(1);
      });

      // Проверяем, что redirect был передан
      const formData = mockSignIn.mock.calls[0][0] as FormData;
      expect(formData.get("redirect")).toBe("/dashboard/transactions");
    });

    it("должен показывать состояние загрузки при отправке формы", async () => {
      mockSignIn.mockImplementation(
        () =>
          new Promise<{ error: string } | undefined>((resolve) => {
            setTimeout(() => {
              resolve(undefined);
            }, 100);
          })
      );

      const user = userEvent.setup();
      renderWithProviders(<LoginPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      const submitButton = screen.getByRole("button", {
        name: /login\.submit/i,
      });
      await user.click(submitButton);

      // Проверяем, что кнопка показывает состояние загрузки
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });
  });
});
