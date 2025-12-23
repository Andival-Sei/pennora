import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  waitFor,
  userEvent,
} from "../../utils/test-utils";
import SettingsPage from "@/app/(main)/dashboard/settings/page";

// Мокируем Supabase клиент
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockLinkIdentity = vi.fn();
const mockUnlinkIdentity = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
      linkIdentity: mockLinkIdentity,
      unlinkIdentity: mockUnlinkIdentity,
      verifyOtp: mockVerifyOtp,
    },
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
    })),
  })),
}));

// Мокируем actions
const mockDeleteAccount = vi.fn();
vi.mock("@/app/(main)/dashboard/actions", () => ({
  deleteAccount: () => mockDeleteAccount(),
}));

// Мокируем getAppUrl и cn
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    getAppUrl: vi.fn(() => "http://localhost:3000"),
  };
});

// Мокируем компоненты
vi.mock("@/components/motion", () => ({
  FadeIn: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/layout", () => ({
  ResponsiveContainer: ({
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

// Мок для framer-motion, чтобы анимации не мешали тестам
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      onClick,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initial: _initial,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      animate: _animate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      exit: _exit,
      ...rest
    }: React.PropsWithChildren<{
      className?: string;
      onClick?: () => void;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
    }>) => (
      <div className={className} onClick={onClick} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({
    children,
  }: {
    children: React.ReactNode;
    mode?: string;
  }) => <>{children}</>,
}));

describe("SettingsPage", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    identities: [{ provider: "email", id: "1" }],
  };

  const mockProfile = {
    display_name: "Test User",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    });
    mockEq.mockReturnValue({
      update: vi.fn().mockResolvedValue({ error: null }),
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockDeleteAccount.mockResolvedValue(undefined);
  });

  describe("рендеринг", () => {
    it("должен инициализировать компонент", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });
    });

    it("должен загружать данные пользователя", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      // Ждем загрузки данных пользователя
      await waitFor(
        () => {
          const emailInput = document.querySelector(
            'input[type="email"]'
          ) as HTMLInputElement;
          expect(emailInput?.value).toBe("test@example.com");
        },
        { timeout: 3000 }
      );
    });

    it("должен отображать текущий displayName", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      // Ждем загрузки данных и инициализации формы
      await waitFor(
        () => {
          const displayNameInput = document.querySelector(
            'input[id="displayName"]'
          ) as HTMLInputElement;
          expect(displayNameInput?.value).toBe("Test User");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("форма обновления профиля", () => {
    it("должен отображать форму профиля", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const displayNameInput = document.querySelector(
            'input[id="displayName"]'
          );
          expect(displayNameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен показывать ошибку валидации для displayName меньше 2 символов", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const displayNameInput = document.querySelector(
            'input[id="displayName"]'
          );
          expect(displayNameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const displayNameInput = document.querySelector(
        'input[id="displayName"]'
      ) as HTMLInputElement;
      await user.clear(displayNameInput);
      await user.type(displayNameInput, "A");

      const submitButton = screen.getByRole("button", { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Ищем переведённое сообщение: "Имя должно содержать минимум 2 символа"
        expect(screen.getByText(/минимум 2 символа/i)).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку валидации для displayName больше 50 символов", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const displayNameInput = document.querySelector(
            'input[id="displayName"]'
          );
          expect(displayNameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const displayNameInput = document.querySelector(
        'input[id="displayName"]'
      ) as HTMLInputElement;
      await user.clear(displayNameInput);
      await user.type(displayNameInput, "A".repeat(51));

      const submitButton = screen.getByRole("button", { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Ищем переведённое сообщение: "Имя не должно превышать 50 символов"
        expect(screen.getByText(/не должно превышать 50/i)).toBeInTheDocument();
      });
    });

    it("должен успешно обновлять профиль", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const displayNameInput = document.querySelector(
            'input[id="displayName"]'
          );
          expect(displayNameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const displayNameInput = document.querySelector(
        'input[id="displayName"]'
      ) as HTMLInputElement;
      await user.clear(displayNameInput);
      await user.type(displayNameInput, "New Name");

      const submitButton = screen.getByRole("button", { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Проверяем, что mockUpdate был вызван (через цепочку from().update().eq())
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it("должен показывать ошибку при неудачном обновлении профиля", async () => {
      // Настраиваем мок для возврата ошибки: from().update().eq()
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: "Database error" },
        }),
      });

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const displayNameInput = document.querySelector(
            'input[id="displayName"]'
          );
          expect(displayNameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const displayNameInput = document.querySelector(
        'input[id="displayName"]'
      ) as HTMLInputElement;
      await user.clear(displayNameInput);
      await user.type(displayNameInput, "New Name");

      const submitButton = screen.getByRole("button", { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Ищем переведённое сообщение об ошибке: "Ошибка сервера"
        expect(screen.getByText(/ошибка сервера/i)).toBeInTheDocument();
      });
    });

    it("должен показывать успешное сообщение после обновления", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const displayNameInput = document.querySelector(
            'input[id="displayName"]'
          );
          expect(displayNameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const displayNameInput = document.querySelector(
        'input[id="displayName"]'
      ) as HTMLInputElement;
      await user.clear(displayNameInput);
      await user.type(displayNameInput, "New Name");

      const submitButton = screen.getByRole("button", { name: /сохранить/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/профиль успешно обновлён/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("форма смены пароля", () => {
    it("должен отображать форму смены пароля", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен показывать поле текущего пароля для пользователей с паролем", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const currentPasswordInput = document.querySelector(
            'input[id="currentPassword"]'
          );
          expect(currentPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен скрывать поле текущего пароля для OAuth пользователей", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            ...mockUser,
            identities: [{ provider: "google", id: "1" }],
          },
        },
        error: null,
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.queryByLabelText(/password\.current/i)
        ).not.toBeInTheDocument();
      });
    });

    it("должен показывать ошибку для пароля меньше 8 символов", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "Short1");

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await user.click(submitButton);

      // Кнопка должна быть заблокирована из-за невалидного пароля (слишком короткий)
      const submitButton2 = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await waitFor(() => {
        expect(submitButton2).toBeDisabled();
      });
    });

    it("должен блокировать кнопку для пароля без заглавной буквы", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "lowercase123");

      // Кнопка должна быть заблокирована из-за невалидного пароля
      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("должен блокировать кнопку для пароля без строчной буквы", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "UPPERCASE123");

      // Кнопка должна быть заблокирована из-за невалидного пароля
      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("должен блокировать кнопку для пароля без цифры", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "NoNumbers");

      // Кнопка должна быть заблокирована из-за невалидного пароля
      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("должен блокировать кнопку для пароля с кириллицей", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "Пароль123");

      // Кнопка должна быть заблокирована из-за невалидного пароля
      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("должен блокировать кнопку при несовпадении паролей", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "ValidPass123");

      const confirmPasswordInput = document.querySelector(
        'input[id="confirmPassword"]'
      ) as HTMLInputElement;
      await user.type(confirmPasswordInput, "Different123");

      // Кнопка должна быть заблокирована из-за несовпадения паролей
      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("должен успешно менять пароль", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const currentPasswordInput = document.querySelector(
        'input[id="currentPassword"]'
      ) as HTMLInputElement;
      await user.type(currentPasswordInput, "OldPassword123");

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "NewPassword123");

      const confirmPasswordInput = document.querySelector(
        'input[id="confirmPassword"]'
      ) as HTMLInputElement;
      await user.type(confirmPasswordInput, "NewPassword123");

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });
    });

    it("должен показывать успешное сообщение после смены пароля", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const currentPasswordInput = document.querySelector(
        'input[id="currentPassword"]'
      ) as HTMLInputElement;
      await user.type(currentPasswordInput, "OldPassword123");

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "NewPassword123");

      const confirmPasswordInput = document.querySelector(
        'input[id="confirmPassword"]'
      ) as HTMLInputElement;
      await user.type(confirmPasswordInput, "NewPassword123");

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/пароль успешно изменён/i)).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку при неудачной смене пароля", async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: "Error updating password" },
      });

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newPasswordInput = document.querySelector(
            'input[id="newPassword"]'
          );
          expect(newPasswordInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const currentPasswordInput = document.querySelector(
        'input[id="currentPassword"]'
      ) as HTMLInputElement;
      await user.type(currentPasswordInput, "OldPassword123");

      const newPasswordInput = document.querySelector(
        'input[id="newPassword"]'
      ) as HTMLInputElement;
      await user.type(newPasswordInput, "NewPassword123");

      const confirmPasswordInput = document.querySelector(
        'input[id="confirmPassword"]'
      ) as HTMLInputElement;
      await user.type(confirmPasswordInput, "NewPassword123");

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        // Ищем переведённое сообщение об ошибке: "Произошла ошибка"
        expect(screen.getByText(/произошла ошибка/i)).toBeInTheDocument();
      });
    });
  });

  describe("форма смены email", () => {
    it("должен отображать форму смены email", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен показывать ошибку для невалидного email", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const emailInput = document.querySelector(
        'input[id="newEmail"]'
      ) as HTMLInputElement;
      await user.type(emailInput, "invalid-email");

      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      await user.click(sendCodeButton);

      await waitFor(() => {
        // Ищем переведённое сообщение: "Некорректный формат email"
        expect(
          screen.getByText(/некорректный формат email/i)
        ).toBeInTheDocument();
      });
    });

    it("должен блокировать кнопку для того же email", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const emailInput = document.querySelector(
        'input[id="newEmail"]'
      ) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");

      // Кнопка должна быть заблокирована, если новый email совпадает с текущим
      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      expect(sendCodeButton).toBeDisabled();
    });

    it("должен отправлять код подтверждения", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const emailInput = document.querySelector(
        'input[id="newEmail"]'
      ) as HTMLInputElement;
      await user.type(emailInput, "newemail@example.com");

      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          email: "newemail@example.com",
        });
      });
    });

    it("должен показывать поле для кода подтверждения после отправки", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const emailInput = document.querySelector(
        'input[id="newEmail"]'
      ) as HTMLInputElement;
      await user.type(emailInput, "newemail@example.com");

      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      await user.click(sendCodeButton);

      await waitFor(() => {
        const codeInput = document.querySelector(
          'input[id="verificationCode"]'
        );
        expect(codeInput).toBeInTheDocument();
      });
    });

    it("должен блокировать кнопку подтверждения для короткого кода", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const emailInput = document.querySelector(
        'input[id="newEmail"]'
      ) as HTMLInputElement;
      await user.type(emailInput, "newemail@example.com");

      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      await user.click(sendCodeButton);

      await waitFor(() => {
        const codeInput = document.querySelector(
          'input[id="verificationCode"]'
        );
        expect(codeInput).toBeInTheDocument();
      });

      const codeInput = document.querySelector(
        'input[id="verificationCode"]'
      ) as HTMLInputElement;
      await user.type(codeInput, "123");

      // Кнопка должна быть заблокирована для короткого кода (меньше 6 символов)
      const confirmButton = screen.getByRole("button", {
        name: /подтвердить/i,
      });
      expect(confirmButton).toBeDisabled();
    });

    // TODO: Тест требует глубокого мокирования useEmailChange хука
    it.skip("должен подтверждать смену email с валидным кодом", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockGetUser.mockResolvedValue({
        data: {
          user: { ...mockUser, email: "newemail@example.com" },
        },
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const emailInput = document.querySelector(
        'input[id="newEmail"]'
      ) as HTMLInputElement;
      await user.type(emailInput, "newemail@example.com");

      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      await user.click(sendCodeButton);

      await waitFor(() => {
        const codeInput = document.querySelector(
          'input[id="verificationCode"]'
        );
        expect(codeInput).toBeInTheDocument();
      });

      const codeInput = document.querySelector(
        'input[id="verificationCode"]'
      ) as HTMLInputElement;
      await user.type(codeInput, "123456");

      const confirmButton = screen.getByRole("button", {
        name: /подтвердить/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          email: "newemail@example.com",
          token: "123456",
          type: "email_change",
        });
      });
    });

    // TODO: Тест требует глубокого мокирования useEmailChange хука
    it.skip("должен показывать успешное сообщение после смены email", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      mockGetUser.mockResolvedValue({
        data: {
          user: { ...mockUser, email: "newemail@example.com" },
        },
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          const newEmailInput = document.querySelector('input[id="newEmail"]');
          expect(newEmailInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const emailInput = document.querySelector(
        'input[id="newEmail"]'
      ) as HTMLInputElement;
      await user.type(emailInput, "newemail@example.com");

      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      await user.click(sendCodeButton);

      await waitFor(() => {
        const codeInput = document.querySelector(
          'input[id="verificationCode"]'
        );
        expect(codeInput).toBeInTheDocument();
      });

      const codeInput = document.querySelector(
        'input[id="verificationCode"]'
      ) as HTMLInputElement;
      await user.type(codeInput, "123456");

      const confirmButton = screen.getByRole("button", {
        name: /подтвердить/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/email успешно изменён/i)).toBeInTheDocument();
      });
    });
  });

  describe("удаление аккаунта", () => {
    it("должен показывать кнопку удаления аккаунта", async () => {
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", {
          name: /удалить аккаунт/i,
        });
        expect(deleteButton).toBeInTheDocument();
      });
    });

    // TODO: Тест требует правильного мокирования DeleteAccountModal с framer-motion
    it.skip("должен открывать модальное окно подтверждения", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(
        () => {
          const deleteButton = screen.getByRole("button", {
            name: /удалить аккаунт/i,
          });
          expect(deleteButton).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const deleteButton = screen.getByRole("button", {
        name: /удалить аккаунт/i,
      });
      await user.click(deleteButton);

      await waitFor(
        () => {
          // Модальное окно показывает описание об удалении аккаунта
          expect(screen.getByText(/безвозвратно удалены/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    // TODO: Тест требует правильного мокирования DeleteAccountModal с framer-motion
    it.skip("должен закрывать модальное окно при отмене", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", {
          name: /удалить аккаунт/i,
        });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", {
        name: /удалить аккаунт/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        // Модальное окно показывает описание об удалении аккаунта
        expect(screen.getByText(/безвозвратно удалены/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /отмена/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/безвозвратно удалены/i)
        ).not.toBeInTheDocument();
      });
    });

    // TODO: Тест требует правильного мокирования DeleteAccountModal с framer-motion
    it.skip("должен вызывать deleteAccount при подтверждении", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", {
          name: /удалить аккаунт/i,
        });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", {
        name: /удалить аккаунт/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        // Модальное окно показывает описание об удалении аккаунта
        expect(screen.getByText(/безвозвратно удалены/i)).toBeInTheDocument();
      });

      // Кнопка подтверждения в модальном окне - "Удалить аккаунт" (account.deleteAccount.confirm)
      const allDeleteButtons = screen.getAllByRole("button", {
        name: /удалить аккаунт/i,
      });
      // Вторая кнопка - это кнопка подтверждения в модальном окне
      const confirmButton = allDeleteButtons[allDeleteButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalled();
      });
    });

    // TODO: Тест требует правильного мокирования DeleteAccountModal с framer-motion
    it.skip("должен показывать ошибку при неудачном удалении", async () => {
      mockDeleteAccount.mockResolvedValue({ error: "Error deleting account" });

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", {
          name: /удалить аккаунт/i,
        });
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", {
        name: /удалить аккаунт/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        // Модальное окно показывает описание об удалении аккаунта
        expect(screen.getByText(/безвозвратно удалены/i)).toBeInTheDocument();
      });

      // Кнопка подтверждения в модальном окне - "Удалить аккаунт" (account.deleteAccount.confirm)
      const allDeleteButtons = screen.getAllByRole("button", {
        name: /удалить аккаунт/i,
      });
      // Вторая кнопка - это кнопка подтверждения в модальном окне
      const confirmButton = allDeleteButtons[allDeleteButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        // Ищем переведённое сообщение: "Произошла неизвестная ошибка"
        expect(
          screen.getByText(/произошла неизвестная ошибка/i)
        ).toBeInTheDocument();
      });
    });
  });
});
