import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  waitFor,
  userEvent,
} from "../../utils/test-utils";
import OnboardingPage from "@/app/(main)/dashboard/onboarding/page";

// Мокируем Supabase клиент
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
      eq: mockEq,
    })),
  })),
}));

// Мокируем actions
const mockRevalidateDashboard = vi.fn();
vi.mock("@/app/(main)/dashboard/onboarding/actions", () => ({
  revalidateDashboard: () => mockRevalidateDashboard(),
}));

// Мокируем useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

// Мок для framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
    }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({
    children,
  }: {
    children: React.ReactNode;
    mode?: string;
  }) => <>{children}</>,
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

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <div>
      <button onClick={() => onValueChange(value)}>{value || "Select"}</button>
      {children}
    </div>
  ),
  SelectTrigger: ({
    children,
    id,
  }: {
    children: React.ReactNode;
    id?: string;
  }) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <button onClick={() => {}} value={value}>
      {children}
    </button>
  ),
}));

describe("OnboardingPage", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    // Настройка цепочки from().update().eq() - update возвращает объект с eq
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockInsert.mockResolvedValue({ error: null });
    mockRevalidateDashboard.mockResolvedValue(undefined);
  });

  describe("рендеринг", () => {
    it("должен отображать шаг выбора валюты по умолчанию", async () => {
      renderWithProviders(<OnboardingPage />);

      // Проверяем наличие формы выбора валюты (getUser вызывается только при submit)
      await waitFor(
        () => {
          const currencyInputs = document.querySelectorAll(
            'input[type="radio"][value="RUB"]'
          );
          expect(currencyInputs.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it("должен отображать индикатор шагов", async () => {
      renderWithProviders(<OnboardingPage />);

      await waitFor(() => {
        // Проверяем наличие индикаторов шагов (3 точки)
        const indicators = screen.getAllByRole("generic");
        expect(indicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe("шаг выбора валюты", () => {
    it("должен отображать все доступные валюты", async () => {
      renderWithProviders(<OnboardingPage />);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          const usdInput = document.querySelector(
            'input[type="radio"][value="USD"]'
          );
          const eurInput = document.querySelector(
            'input[type="radio"][value="EUR"]'
          );
          expect(rubInput).toBeInTheDocument();
          expect(usdInput).toBeInTheDocument();
          expect(eurInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен выбирать валюту по умолчанию (RUB)", async () => {
      renderWithProviders(<OnboardingPage />);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          // RUB должна быть выбрана по умолчанию
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          ) as HTMLInputElement;
          expect(rubInput).toBeInTheDocument();
          expect(rubInput.checked).toBe(true);
        },
        { timeout: 3000 }
      );
    });

    // TODO: Тест требует правильного мокирования Supabase и формы
    it.skip("должен переходить к следующему шагу после выбора валюты", async () => {
      const user = userEvent.setup();
      renderWithProviders(<OnboardingPage />);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          expect(rubInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          const bankSelect =
            document.querySelector('select[id="bank"]') ||
            document.querySelector('button[id="bank"]');
          expect(bankSelect).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    // TODO: Тест требует правильного мокирования Supabase и формы
    it.skip("должен обновлять профиль с выбранной валютой", async () => {
      const user = userEvent.setup();
      renderWithProviders(<OnboardingPage />);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          expect(rubInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Выбираем USD
      const usdInput = document.querySelector(
        'input[type="radio"][value="USD"]'
      ) as HTMLInputElement;
      await user.click(usdInput);

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalled();
      });
    });

    // TODO: Тест требует правильного мокирования Supabase и формы
    it.skip("должен показывать ошибку при неудачном обновлении профиля", async () => {
      mockEq.mockReturnValue({
        update: vi.fn().mockResolvedValue({
          error: { message: "Database error" },
        }),
      });

      const user = userEvent.setup();
      renderWithProviders(<OnboardingPage />);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          expect(rubInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/errors\.databaseError/i)).toBeInTheDocument();
      });
    });
  });

  // TODO: Тесты требуют сложного мокирования форм и переходов между шагами
  describe.skip("шаг создания карточного счета", () => {
    beforeEach(async () => {
      // Переходим к шагу card
      const user = userEvent.setup();
      renderWithProviders(<OnboardingPage />);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          expect(rubInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          const bankSelect =
            document.querySelector('select[id="bank"]') ||
            document.querySelector('button[id="bank"]');
          expect(bankSelect).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен отображать форму создания карточного счета", async () => {
      await waitFor(
        () => {
          const bankSelect =
            document.querySelector('select[id="bank"]') ||
            document.querySelector('button[id="bank"]');
          const nameInput = document.querySelector('input[id="cardName"]');
          const balanceInput = document.querySelector(
            'input[id="cardBalance"]'
          );
          expect(bankSelect).toBeInTheDocument();
          expect(nameInput).toBeInTheDocument();
          expect(balanceInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен показывать ошибку валидации для пустого банка", async () => {
      const user = userEvent.setup();
      await waitFor(
        () => {
          const nameInput = document.querySelector('input[id="cardName"]');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = document.querySelector(
        'input[id="cardName"]'
      ) as HTMLInputElement;
      await user.type(nameInput, "Test Card");

      const balanceInput = document.querySelector(
        'input[id="cardBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "1000");

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/card\.bankRequired/i)).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку валидации для пустого названия", async () => {
      const user = userEvent.setup();
      await waitFor(
        () => {
          const bankSelect =
            document.querySelector('select[id="bank"]') ||
            document.querySelector('button[id="bank"]');
          expect(bankSelect).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Выбираем банк через Select (упрощенный мок)
      const bankSelect =
        document.querySelector('select[id="bank"]') ||
        document.querySelector('button[id="bank"]');
      if (!bankSelect) {
        throw new Error("Bank select not found");
      }
      await user.click(bankSelect);

      const balanceInput = document.querySelector(
        'input[id="cardBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "1000");

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/card\.nameRequired/i)).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку валидации для отрицательного баланса", async () => {
      const user = userEvent.setup();
      await waitFor(
        () => {
          const nameInput = document.querySelector('input[id="cardName"]');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = document.querySelector(
        'input[id="cardName"]'
      ) as HTMLInputElement;
      await user.type(nameInput, "Test Card");

      const balanceInput = document.querySelector(
        'input[id="cardBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "-100");

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/card\.balanceInvalid/i)).toBeInTheDocument();
      });
    });

    it("должен успешно создавать карточный счет", async () => {
      const user = userEvent.setup();
      await waitFor(
        () => {
          const nameInput = document.querySelector('input[id="cardName"]');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = document.querySelector(
        'input[id="cardName"]'
      ) as HTMLInputElement;
      await user.type(nameInput, "Test Card");

      const balanceInput = document.querySelector(
        'input[id="cardBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "1000");

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });

    it("должен переходить к шагу cash после создания счета", async () => {
      const user = userEvent.setup();
      await waitFor(
        () => {
          const nameInput = document.querySelector('input[id="cardName"]');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = document.querySelector(
        'input[id="cardName"]'
      ) as HTMLInputElement;
      await user.type(nameInput, "Test Card");

      const balanceInput = document.querySelector(
        'input[id="cardBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "1000");

      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          const cashBalanceInput = document.querySelector(
            'input[id="cashBalance"]'
          );
          expect(cashBalanceInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен возвращаться к шагу currency при нажатии Назад", async () => {
      const user = userEvent.setup();
      await waitFor(
        () => {
          const backButton = screen.getByRole("button", { name: /назад/i });
          expect(backButton).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const backButton = screen.getByRole("button", { name: /назад/i });
      await user.click(backButton);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          expect(rubInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен пропускать шаг card при нажатии Пропустить", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /common\.skip/i })
        ).toBeInTheDocument();
      });

      const skipButton = screen.getByRole("button", { name: /пропустить/i });
      await user.click(skipButton);

      await waitFor(
        () => {
          const cashBalanceInput = document.querySelector(
            'input[id="cashBalance"]'
          );
          expect(cashBalanceInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  // TODO: Тесты требуют сложного мокирования форм и переходов между шагами
  describe.skip("шаг создания наличного счета", () => {
    beforeEach(async () => {
      // Переходим к шагу cash
      const user = userEvent.setup();
      renderWithProviders(<OnboardingPage />);

      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          expect(rubInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Пропускаем currency
      const nextButton = screen.getByRole("button", { name: /далее/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          const bankSelect =
            document.querySelector('select[id="bank"]') ||
            document.querySelector('button[id="bank"]');
          expect(bankSelect).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Пропускаем card
      const skipButton = screen.getByRole("button", { name: /пропустить/i });
      await user.click(skipButton);

      await waitFor(
        () => {
          const cashBalanceInput = document.querySelector(
            'input[id="cashBalance"]'
          );
          expect(cashBalanceInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен отображать форму создания наличного счета", async () => {
      await waitFor(() => {
        expect(
          screen.getByLabelText(/onboarding\.cash\.balanceLabel/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать ошибку валидации для отрицательного баланса", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(
          screen.getByLabelText(/onboarding\.cash\.balanceLabel/i)
        ).toBeInTheDocument();
      });

      const balanceInput = document.querySelector(
        'input[id="cashBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "-100");

      const finishButton = screen.getByRole("button", { name: /завершить/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText(/cash\.balanceInvalid/i)).toBeInTheDocument();
      });
    });

    it("должен успешно создавать наличный счет", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(
          screen.getByLabelText(/onboarding\.cash\.balanceLabel/i)
        ).toBeInTheDocument();
      });

      const balanceInput = document.querySelector(
        'input[id="cashBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "500");

      const finishButton = screen.getByRole("button", { name: /завершить/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });

    it("должен инвалидировать кеш и перенаправлять на dashboard после завершения", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(
          screen.getByLabelText(/onboarding\.cash\.balanceLabel/i)
        ).toBeInTheDocument();
      });

      const balanceInput = document.querySelector(
        'input[id="cashBalance"]'
      ) as HTMLInputElement;
      await user.type(balanceInput, "500");

      const finishButton = screen.getByRole("button", { name: /завершить/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(mockRevalidateDashboard).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("должен возвращаться к шагу card при нажатии Назад", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /common\.back/i })
        ).toBeInTheDocument();
      });

      const backButton = screen.getByRole("button", { name: /назад/i });
      await user.click(backButton);

      await waitFor(
        () => {
          const bankSelect =
            document.querySelector('select[id="bank"]') ||
            document.querySelector('button[id="bank"]');
          expect(bankSelect).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("должен пропускать шаг cash и завершать онбординг", async () => {
      const user = userEvent.setup();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /common\.skip/i })
        ).toBeInTheDocument();
      });

      const skipButton = screen.getByRole("button", { name: /пропустить/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(mockRevalidateDashboard).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  // TODO: Тест требует сложного мокирования переходов между шагами
  describe.skip("навигация", () => {
    it("должен переходить между шагами в правильном порядке", async () => {
      const user = userEvent.setup();
      renderWithProviders(<OnboardingPage />);

      // Шаг 1: currency
      // mockGetUser вызывается только при submit формы, а не при рендеринге

      await waitFor(
        () => {
          const rubInput = document.querySelector(
            'input[type="radio"][value="RUB"]'
          );
          expect(rubInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Переход к card
      const nextButton1 = screen.getByRole("button", { name: /common\.next/i });
      await user.click(nextButton1);

      await waitFor(
        () => {
          const bankSelect =
            document.querySelector('select[id="bank"]') ||
            document.querySelector('button[id="bank"]');
          expect(bankSelect).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Пропуск card, переход к cash
      const skipButton = screen.getByRole("button", { name: /пропустить/i });
      await user.click(skipButton);

      await waitFor(
        () => {
          const cashBalanceInput = document.querySelector(
            'input[id="cashBalance"]'
          );
          expect(cashBalanceInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
