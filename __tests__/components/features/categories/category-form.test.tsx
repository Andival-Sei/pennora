import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  waitFor,
  userEvent,
} from "../../../utils/test-utils";
import { CategoryForm } from "@/components/features/categories/CategoryForm";
import type { Category } from "@/lib/types/category";

// Мокируем next-intl для тестов (уже сделано в setup.ts, но можем переопределить если нужно)

const mockParentCategories: Category[] = [
  {
    id: "parent-1",
    name: "Родительская категория",
    type: "expense",
    user_id: "test-user-id",
    parent_id: null,
    icon: "Home",
    color: "#10b981",
    is_archived: false,
    is_system: false,
    sort_order: 0,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

describe("CategoryForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue({
      id: "new-category-id",
      name: "Новая категория",
      type: "expense",
    });
  });

  it("should render form when open", async () => {
    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        parentCategories={mockParentCategories}
      />
    );

    // Ждем, пока Dialog полностью откроется и элементы станут доступны
    await waitFor(
      () => {
        expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/тип/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should not render form when closed", () => {
    renderWithProviders(
      <CategoryForm
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // Dialog должен быть скрыт
    expect(screen.queryByLabelText(/название/i)).not.toBeInTheDocument();
  });

  it("should display validation error for empty name", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    });

    // Очищаем поле name
    const nameInput = screen.getByLabelText(/название/i);
    await user.clear(nameInput);

    // Находим кнопку сохранения и кликаем
    const submitButton = screen.getByRole("button", { name: /сохранить/i });
    await user.click(submitButton);

    // Проверяем наличие ошибки валидации - ищем переведённый текст
    await waitFor(() => {
      expect(
        screen.getByText(/название категории обязательно/i)
      ).toBeInTheDocument();
    });
  });

  it("should display validation error for name longer than 50 characters", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/название/i);
    await user.clear(nameInput);
    await user.type(nameInput, "А".repeat(51)); // 51 символ

    const submitButton = screen.getByRole("button", { name: /сохранить/i });
    await user.click(submitButton);

    // Ищем переведённый текст об ошибке длины
    await waitFor(() => {
      expect(screen.getByText(/не должно превышать 50/i)).toBeInTheDocument();
    });
  });

  it("should accept name with exactly 50 characters", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/название/i);
    await user.clear(nameInput);
    await user.type(nameInput, "А".repeat(50)); // Ровно 50 символов

    const submitButton = screen.getByRole("button", { name: /сохранить/i });
    await user.click(submitButton);

    // Не должно быть ошибки валидации
    await waitFor(() => {
      expect(
        screen.queryByText(/не должно превышать 50/i)
      ).not.toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    });

    // Заполняем форму
    const nameInput = screen.getByLabelText(/название/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Новая категория");

    // Тип уже выбран по умолчанию (expense)
    // Можно выбрать другой тип если нужно

    const submitButton = screen.getByRole("button", { name: /сохранить/i });
    await user.click(submitButton);

    // Проверяем, что onSubmit был вызван
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("should close dialog after successful submission", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/название/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Новая категория");

    const submitButton = screen.getByRole("button", { name: /сохранить/i });
    await user.click(submitButton);

    // После успешной отправки должен вызываться onOpenChange(false)
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should render with initial data for editing", () => {
    const category: Category = {
      id: "cat-1",
      name: "Существующая категория",
      type: "income",
      user_id: "test-user-id",
      parent_id: null,
      icon: "Home",
      color: "#ef4444",
      is_archived: false,
      is_system: false,
      sort_order: 0,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };

    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        category={category}
        onSubmit={mockOnSubmit}
      />
    );

    // Проверяем, что поле name содержит значение категории
    const nameInput = screen.getByLabelText(/название/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Существующая категория");
  });

  // TODO: Тест требует обработки rejected promise в компоненте
  it.skip("should handle submission error", async () => {
    const user = userEvent.setup();
    const error = new Error("Failed to create category");
    mockOnSubmit.mockRejectedValue(error);

    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/название/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Категория");

    const submitButton = screen.getByRole("button", { name: /сохранить/i });
    await user.click(submitButton);

    // Проверяем, что onSubmit был вызван (с ошибкой)
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Диалог не должен закрываться при ошибке
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });

  // TODO: Тест требует мокирования CascadingCategorySelect компонента
  it.skip("should allow selecting parent category", async () => {
    renderWithProviders(
      <CategoryForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        parentCategories={mockParentCategories}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    });

    // Проверяем наличие поля для выбора родительской категории
    // В реальном компоненте это может быть CascadingCategorySelect или ComboBox
    // Проверяем что компонент с parent categories рендерится
    expect(screen.getByLabelText(/родительская/i)).toBeInTheDocument();
  });
});
