import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../utils/test-utils";
import { ErrorState } from "@/components/ui/error-state";

describe("ErrorState", () => {
  it("should render error from Error object", () => {
    const error = new Error("Test error message");
    renderWithProviders(<ErrorState error={error} />);

    // getErrorMessage возвращает переведенное сообщение "Произошла ошибка" для Error объектов
    // Проверяем заголовок (h3)
    const title = screen.getByRole("heading", { name: /произошла ошибка/i });
    expect(title).toBeInTheDocument();
    // Проверяем сообщение об ошибке (p) - может быть переведенное сообщение
    const errorMessages = screen.getAllByText(/произошла ошибка/i);
    expect(errorMessages.length).toBeGreaterThanOrEqual(1);
  });

  it("should render string error", () => {
    const error = "Custom error message";
    renderWithProviders(<ErrorState error={error} />);

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("should render custom title", () => {
    const error = new Error("Test error");
    renderWithProviders(
      <ErrorState error={error} title="Custom Error Title" />
    );

    expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
  });

  it("should render custom description", () => {
    const error = new Error("Test error");
    renderWithProviders(
      <ErrorState error={error} description="Custom description" />
    );

    expect(screen.getByText("Custom description")).toBeInTheDocument();
  });

  it("should prioritize description over error message", () => {
    const error = new Error("Original error");
    renderWithProviders(
      <ErrorState error={error} description="Custom description" />
    );

    expect(screen.getByText("Custom description")).toBeInTheDocument();
    // description имеет приоритет, поэтому оригинальное сообщение не должно быть видно
    expect(screen.queryByText("Original error")).not.toBeInTheDocument();
  });

  it("should show retry button when onRetry is provided and showRetry is true", () => {
    const onRetry = vi.fn();
    renderWithProviders(<ErrorState error="Error" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", {
      name: /повторить попытку/i,
    });
    expect(retryButton).toBeInTheDocument();
  });

  it("should not show retry button when showRetry is false", () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ErrorState error="Error" onRetry={onRetry} showRetry={false} />
    );

    expect(
      screen.queryByRole("button", { name: /повторить попытку/i })
    ).not.toBeInTheDocument();
  });

  it("should not show retry button when onRetry is not provided", () => {
    renderWithProviders(<ErrorState error="Error" />);

    expect(
      screen.queryByRole("button", { name: /повторить попытку/i })
    ).not.toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderWithProviders(<ErrorState error="Error" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", {
      name: /повторить попытку/i,
    });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should render default title when no title is provided", () => {
    const error = new Error("Test error");
    renderWithProviders(<ErrorState error={error} />);

    // По умолчанию используется t("unknown"), что возвращает "Произошла ошибка" в моках
    // Заголовок и сообщение об ошибке содержат "Произошла ошибка"
    const titles = screen.getAllByText("Произошла ошибка");
    expect(titles.length).toBeGreaterThanOrEqual(2); // Заголовок и сообщение
    // Проверяем заголовок
    const title = screen.getByRole("heading", { name: /произошла ошибка/i });
    expect(title).toBeInTheDocument();
  });

  it("should render error icon", () => {
    const { container } = renderWithProviders(<ErrorState error="Error" />);

    // Иконка AlertCircle должна быть в DOM
    // Ищем SVG элемент внутри компонента
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Проверяем, что компонент рендерится
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = renderWithProviders(
      <ErrorState error="Error" className="custom-class" />
    );

    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass("custom-class");
  });

  it("should handle unknown error type gracefully", () => {
    const error = { code: 500, message: "Server error" };
    renderWithProviders(<ErrorState error={error} />);

    // Компонент должен рендериться без ошибок даже с неизвестным типом ошибки
    // Для неизвестных типов ошибок возвращается fallback сообщение "Произошла неизвестная ошибка"
    const errorMessages = screen.getAllByText(
      /Произошла неизвестная ошибка|Произошла ошибка/
    );
    expect(errorMessages.length).toBeGreaterThan(0);
    // Проверяем заголовок
    const title = screen.getByRole("heading");
    expect(title).toBeInTheDocument();
  });

  it("should display translated error messages", () => {
    // Мокируем useTranslations для проверки перевода
    const error = new Error("Network error");
    renderWithProviders(<ErrorState error={error} />);

    // Компонент должен использовать переведенные сообщения
    // Для Network error getErrorMessage может вернуть переведенное сообщение
    const errorMessages = screen.getAllByText(
      /Произошла ошибка|Не удалось выполнить запрос/
    );
    expect(errorMessages.length).toBeGreaterThan(0);
    // Проверяем заголовок
    const title = screen.getByRole("heading");
    expect(title).toBeInTheDocument();
  });
});
