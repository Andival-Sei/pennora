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

// Мокируем getAppUrl
vi.mock("@/lib/utils", () => ({
  getAppUrl: vi.fn(() => "http://localhost:3000"),
}));

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
        expect(
          screen.getByText(/validation\.displayName\.min/i)
        ).toBeInTheDocument();
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
        expect(
          screen.getByText(/validation\.displayName\.max/i)
        ).toBeInTheDocument();
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
        expect(mockEq).toHaveBeenCalled();
      });
    });

    it("должен показывать ошибку при неудачном обновлении профиля", async () => {
      mockEq.mockReturnValue({
        update: vi.fn().mockResolvedValue({
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
        expect(screen.getByText(/errors\.databaseError/i)).toBeInTheDocument();
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

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.min/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку для пароля без заглавной буквы", async () => {
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

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
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

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
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

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
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

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.latinOnly/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку при несовпадении паролей", async () => {
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

      const submitButton = screen.getByRole("button", {
        name: /изменить пароль/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/validation\.password\.mismatch/i)
        ).toBeInTheDocument();
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
        expect(screen.getByText(/errors\.unknown/i)).toBeInTheDocument();
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
        expect(screen.getByText(/errors\.invalidEmail/i)).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку для того же email", async () => {
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

      const sendCodeButton = screen.getByRole("button", {
        name: /отправить код/i,
      });
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(screen.getByText(/errors\.sameEmail/i)).toBeInTheDocument();
      });
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

    it("должен показывать ошибку для невалидного кода", async () => {
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

      const confirmButton = screen.getByRole("button", {
        name: /подтвердить/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/errors\.invalidCode/i)).toBeInTheDocument();
      });
    });

    it("должен подтверждать смену email с валидным кодом", async () => {
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

    it("должен показывать успешное сообщение после смены email", async () => {
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

    it("должен открывать модальное окно подтверждения", async () => {
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
        expect(screen.getByText(/удаление аккаунта/i)).toBeInTheDocument();
      });
    });

    it("должен закрывать модальное окно при отмене", async () => {
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
        expect(screen.getByText(/удаление аккаунта/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/удаление аккаунта/i)
        ).not.toBeInTheDocument();
      });
    });

    it("должен вызывать deleteAccount при подтверждении", async () => {
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
        expect(screen.getByText(/удаление аккаунта/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /подтвердить удаление/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalled();
      });
    });

    it("должен показывать ошибку при неудачном удалении", async () => {
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
        expect(screen.getByText(/удаление аккаунта/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /подтвердить удаление/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/errors\.unknown/i)).toBeInTheDocument();
      });
    });
  });
});
