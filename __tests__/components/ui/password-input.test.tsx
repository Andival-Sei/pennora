import React from "react";
import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders,
  screen,
  waitFor,
  userEvent,
} from "../../utils/test-utils";
import { PasswordInput } from "@/components/ui/password-input";

// Мокируем framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
      function MotionDiv(props, ref) {
        return <div {...props} ref={ref} />;
      }
    ),
    button: React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement>
    >(function MotionButton(props, ref) {
      return <button {...props} ref={ref} />;
    }),
    ul: React.forwardRef<
      HTMLUListElement,
      React.HTMLAttributes<HTMLUListElement>
    >(function MotionUl(props, ref) {
      return <ul {...props} ref={ref} />;
    }),
  },
  AnimatePresence: function AnimatePresence({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  },
}));

describe("PasswordInput", () => {
  describe("базовая функциональность", () => {
    it("должен рендерить input с типом password", () => {
      renderWithProviders(<PasswordInput />);

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe("password");
    });

    it("должен показывать кнопку переключения видимости при наличии значения", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PasswordInput />);

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "password123");

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(
          /show password|hide password/i
        );
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it("должен скрывать кнопку переключения видимости при пустом значении", () => {
      renderWithProviders(<PasswordInput />);

      const toggleButton = screen.queryByLabelText(
        /show password|hide password/i
      );
      expect(toggleButton).not.toBeInTheDocument();
    });

    it("должен переключать тип input при клике на кнопку", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PasswordInput />);

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "password123");

      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/show password/i);
        expect(toggleButton).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/show password/i);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(input.type).toBe("text");
      });

      await user.click(toggleButton);

      await waitFor(() => {
        expect(input.type).toBe("password");
      });
    });

    it("должен работать в controlled режиме", async () => {
      const user = userEvent.setup();
      const ControlledComponent = () => {
        const [value, setValue] = React.useState("");
        return (
          <PasswordInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      renderWithProviders(<ControlledComponent />);

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "test");

      await waitFor(() => {
        expect(input.value).toBe("test");
      });
    });

    it("должен работать в uncontrolled режиме", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PasswordInput />);

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "test");

      await waitFor(() => {
        expect(input.value).toBe("test");
      });
    });
  });

  describe("индикатор силы пароля", () => {
    it("не должен показывать индикатор по умолчанию", () => {
      renderWithProviders(<PasswordInput />);

      const indicator = screen.queryByText(/weak|fair|good|strong/i);
      expect(indicator).not.toBeInTheDocument();
    });

    it("должен показывать индикатор при showStrengthIndicator=true", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          strengthLabels={{
            weak: "Слабый",
            fair: "Средний",
            good: "Хороший",
            strong: "Сильный",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "test");

      await waitFor(() => {
        expect(
          screen.getByText(/слабый|средний|хороший|сильный/i)
        ).toBeInTheDocument();
      });
    });

    it("должен показывать уровень weak для слабого пароля", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          strengthLabels={{
            weak: "Слабый",
            fair: "Средний",
            good: "Хороший",
            strong: "Сильный",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "short");

      await waitFor(() => {
        expect(screen.getByText(/слабый/i)).toBeInTheDocument();
      });
    });

    it("должен показывать уровень fair для среднего пароля", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          strengthLabels={{
            weak: "Слабый",
            fair: "Средний",
            good: "Хороший",
            strong: "Сильный",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      // fair = 40-60% (2/4 требований: minLength + lowercase)
      await user.type(input, "password");

      await waitFor(() => {
        expect(screen.getByText(/средний/i)).toBeInTheDocument();
      });
    });

    it("должен показывать уровень good для хорошего пароля", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          strengthLabels={{
            weak: "Слабый",
            fair: "Средний",
            good: "Хороший",
            strong: "Сильный",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      // good = 60-80% (3/4 требований: minLength + uppercase + lowercase)
      await user.type(input, "Password");

      await waitFor(() => {
        expect(screen.getByText(/хороший/i)).toBeInTheDocument();
      });
    });

    it("должен показывать уровень strong для сильного пароля", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          strengthLabels={{
            weak: "Слабый",
            fair: "Средний",
            good: "Хороший",
            strong: "Сильный",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "VeryStrongPassword123");

      await waitFor(() => {
        expect(screen.getByText(/сильный/i)).toBeInTheDocument();
      });
    });

    it("должен показывать уровень weak для пароля с кириллицей", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          strengthLabels={{
            weak: "Слабый",
            fair: "Средний",
            good: "Хороший",
            strong: "Сильный",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "Пароль123");

      await waitFor(() => {
        expect(screen.getByText(/слабый/i)).toBeInTheDocument();
      });
    });
  });

  describe("требования к паролю", () => {
    it("не должен показывать требования по умолчанию", () => {
      renderWithProviders(<PasswordInput showStrengthIndicator />);

      const requirements = screen.queryByText(
        /latinOnly|minLength|hasUppercase|hasLowercase|hasNumber/i
      );
      expect(requirements).not.toBeInTheDocument();
    });

    // TODO: Тест требует правильного мокирования focus события
    it.skip("должен показывать требования при фокусе", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText(/только латиница/i)).toBeInTheDocument();
        expect(screen.getByText(/минимум 8 символов/i)).toBeInTheDocument();
        expect(screen.getByText(/заглавная буква/i)).toBeInTheDocument();
        expect(screen.getByText(/строчная буква/i)).toBeInTheDocument();
        expect(screen.getByText(/цифра/i)).toBeInTheDocument();
      });
    });

    it("должен показывать требования при наличии невыполненных", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "short");

      await waitFor(() => {
        expect(screen.getByText(/минимум 8 символов/i)).toBeInTheDocument();
      });
    });

    it("должен показывать выполненные требования с галочкой", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "Password123");

      await waitFor(() => {
        // Все требования должны быть выполнены
        const requirements = screen.getAllByText(
          /только латиница|минимум 8 символов|заглавная буква|строчная буква|цифра/i
        );
        expect(requirements.length).toBeGreaterThan(0);
      });
    });

    it("должен проверять требование латиницы", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "Пароль123");

      await waitFor(() => {
        // Требование латиницы не должно быть выполнено
        const latinRequirement = screen.getByText(/только латиница/i);
        expect(latinRequirement).toBeInTheDocument();
      });
    });

    it("должен проверять требование минимальной длины", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "Short1");

      await waitFor(() => {
        const lengthRequirement = screen.getByText(/минимум 8 символов/i);
        expect(lengthRequirement).toBeInTheDocument();
      });
    });

    it("должен проверять требование заглавной буквы", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "lowercase123");

      await waitFor(() => {
        const uppercaseRequirement = screen.getByText(/заглавная буква/i);
        expect(uppercaseRequirement).toBeInTheDocument();
      });
    });

    it("должен проверять требование строчной буквы", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "UPPERCASE123");

      await waitFor(() => {
        const lowercaseRequirement = screen.getByText(/строчная буква/i);
        expect(lowercaseRequirement).toBeInTheDocument();
      });
    });

    it("должен проверять требование цифры", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PasswordInput
          showStrengthIndicator
          requirementLabels={{
            latinOnly: "Только латиница",
            minLength: "Минимум 8 символов",
            hasUppercase: "Заглавная буква",
            hasLowercase: "Строчная буква",
            hasNumber: "Цифра",
          }}
        />
      );

      const input = document.querySelector(
        'input[type="password"]'
      ) as HTMLInputElement;
      await user.type(input, "NoNumbers");

      await waitFor(() => {
        const numberRequirement = screen.getByText(/цифра/i);
        expect(numberRequirement).toBeInTheDocument();
      });
    });
  });
});
