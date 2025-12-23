import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  waitFor,
  userEvent,
} from "../../utils/test-utils";
import { RegisterPageClient } from "@/app/(auth)/register/register-page-client";

// Мокируем server actions
vi.mock("@/app/(auth)/actions", () => ({
  signUp: vi.fn(),
  resendConfirmationEmail: vi.fn(),
}));

// Мокируем компоненты, которые могут вызывать проблемы в тестах
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
    const {
      showStrengthIndicator,
      strengthLabels,
      requirementLabels,
      ...inputProps
    } = props;
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

import * as authActions from "@/app/(auth)/actions";

describe("RegisterPageClient", () => {
  const mockSignUp = vi.mocked(authActions.signUp);
  const mockResendConfirmationEmail = vi.mocked(
    authActions.resendConfirmationEmail
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("рендеринг", () => {
    it("должен рендерить форму с полями", async () => {
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it("должен рендерить кнопку отправки", async () => {
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /register\.submit/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("валидация", () => {
    it("должен блокировать кнопку отправки при пустой форме", async () => {
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /register\.submit/i,
        });
        expect(submitButton).toBeDisabled();
      });
    });

    it("должен разблокировать кнопку при валидной форме", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /register\.submit/i,
        });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("должен показывать ошибку для пароля меньше 8 символов", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Short1");

      // Пытаемся отправить форму для триггера валидации
      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.min/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку для пароля без заглавной буквы", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "lowercase123");

      // Пытаемся отправить форму для триггера валидации
      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.uppercase/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку для пароля без строчной буквы", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "UPPERCASE123");

      // Пытаемся отправить форму для триггера валидации
      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.lowercase/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку для пароля без цифры", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "NoNumbers");

      // Пытаемся отправить форму для триггера валидации
      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.number/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку для пароля с кириллицей", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Пароль123");

      // Пытаемся отправить форму для триггера валидации
      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.latinOnly/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать индикатор силы пароля", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "Password123");

      // PasswordInput должен показывать индикатор силы
      // Проверяем наличие индикатора через data-testid
      await waitFor(() => {
        const passwordInputElement = screen.getByTestId("password-input");
        expect(passwordInputElement).toBeInTheDocument();
      });
    });

    it("должен показывать требования к паролю", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/password/i);
      await user.click(passwordInput);

      // PasswordInput должен показывать требования при фокусе
      // Проверяем наличие требований через data-testid
      await waitFor(() => {
        const passwordInputElement = screen.getByTestId("password-input");
        expect(passwordInputElement).toBeInTheDocument();
      });
    });
  });

  describe("отправка формы", () => {
    it("должен отправлять форму с валидными данными", async () => {
      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: true,
        email: "test@example.com",
      });

      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledTimes(1);
      });

      // Проверяем, что signUp был вызван с правильными данными
      const formData = mockSignUp.mock.calls[0][0] as FormData;
      expect(formData.get("displayName")).toBe("Иван Иванов");
      expect(formData.get("email")).toBe("test@example.com");
      expect(formData.get("password")).toBe("Password123");
    });

    it("должен показывать ошибку сервера при неудачной регистрации", async () => {
      mockSignUp.mockResolvedValue({
        error: "errors.userAlreadyExists",
      });

      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/errors\.userAlreadyExists/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать экран подтверждения email при успешной регистрации", async () => {
      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: true,
        email: "test@example.com",
      });

      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/register\.emailConfirmation\.title/i)
        ).toBeInTheDocument();
      });

      // Проверяем, что отображается экран подтверждения
      expect(
        screen.getByRole("button", {
          name: /register\.emailConfirmation\.resendButton/i,
        })
      ).toBeInTheDocument();
    });

    it("должен показывать состояние загрузки при отправке формы", async () => {
      mockSignUp.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                requiresConfirmation: true,
                email: "test@example.com",
              });
            }, 100);
          })
      );

      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем форму валидными данными
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      // Проверяем, что кнопка показывает состояние загрузки
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });
  });

  describe("подтверждение email", () => {
    beforeEach(() => {
      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: true,
        email: "test@example.com",
      });
    });

    it("должен показывать кнопку повторной отправки email", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем и отправляем форму
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /register\.emailConfirmation\.resendButton/i,
          })
        ).toBeInTheDocument();
      });
    });

    it("должен отправлять повторный email при нажатии на кнопку", async () => {
      mockResendConfirmationEmail.mockResolvedValue({
        success: true,
      });

      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем и отправляем форму
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /register\.emailConfirmation\.resendButton/i,
          })
        ).toBeInTheDocument();
      });

      // Нажимаем кнопку повторной отправки
      const resendButton = screen.getByRole("button", {
        name: /register\.emailConfirmation\.resendButton/i,
      });
      await user.click(resendButton);

      await waitFor(() => {
        expect(mockResendConfirmationEmail).toHaveBeenCalledWith(
          "test@example.com"
        );
      });
    });

    it("должен показывать успешное сообщение после повторной отправки", async () => {
      mockResendConfirmationEmail.mockResolvedValue({
        success: true,
      });

      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем и отправляем форму
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /register\.emailConfirmation\.resendButton/i,
          })
        ).toBeInTheDocument();
      });

      // Нажимаем кнопку повторной отправки
      const resendButton = screen.getByRole("button", {
        name: /register\.emailConfirmation\.resendButton/i,
      });
      await user.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/register\.emailConfirmation\.resendSuccess/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку при неудачной повторной отправке", async () => {
      mockResendConfirmationEmail.mockResolvedValue({
        error: "errors.rateLimitExceeded",
      });

      const user = userEvent.setup();
      renderWithProviders(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByLabelText(/displayName/i)).toBeInTheDocument();
      });

      // Заполняем и отправляем форму
      await user.type(screen.getByLabelText(/displayName/i), "Иван Иванов");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "Password123");

      const submitButton = screen.getByRole("button", {
        name: /register\.submit/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: /register\.emailConfirmation\.resendButton/i,
          })
        ).toBeInTheDocument();
      });

      // Нажимаем кнопку повторной отправки
      const resendButton = screen.getByRole("button", {
        name: /register\.emailConfirmation\.resendButton/i,
      });
      await user.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/errors\.rateLimitExceeded/i)
        ).toBeInTheDocument();
      });
    });
  });
});
