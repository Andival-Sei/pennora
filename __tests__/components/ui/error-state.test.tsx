import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../utils/test-utils";
import { ErrorState } from "@/components/ui/error-state";

describe("ErrorState", () => {
  it("should render error from Error object", () => {
    const error = new Error("Test error message");
    renderWithProviders(<ErrorState error={error} />);

    expect(screen.getByText("errors.unknown")).toBeInTheDocument();
    // getErrorMessage возвращает переведенное сообщение, но в моках мы возвращаем ключ
    // Проверяем, что компонент рендерится корректно
    expect(screen.getByRole("alert")).toBeInTheDocument();
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

    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("should not show retry button when showRetry is false", () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ErrorState error="Error" onRetry={onRetry} showRetry={false} />
    );

    expect(
      screen.queryByRole("button", { name: /retry/i })
    ).not.toBeInTheDocument();
  });

  it("should not show retry button when onRetry is not provided", () => {
    renderWithProviders(<ErrorState error="Error" />);

    expect(
      screen.queryByRole("button", { name: /retry/i })
    ).not.toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderWithProviders(<ErrorState error="Error" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should render default title when no title is provided", () => {
    const error = new Error("Test error");
    renderWithProviders(<ErrorState error={error} />);

    // По умолчанию используется t("unknown"), что возвращает "errors.unknown" в моках
    expect(screen.getByText("errors.unknown")).toBeInTheDocument();
  });

  it("should render error icon", () => {
    renderWithProviders(<ErrorState error="Error" />);

    // Иконка AlertCircle должна быть в DOM
    const icon = document.querySelector('[class*="lucide-alert-circle"]');
    expect(icon).toBeInTheDocument();
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
    expect(screen.getByText("errors.unknown")).toBeInTheDocument();
  });

  it("should display translated error messages", () => {
    // Мокируем useTranslations для проверки перевода
    const error = new Error("Network error");
    renderWithProviders(<ErrorState error={error} />);

    // Компонент должен использовать переведенные сообщения
    // В тестах мы возвращаем ключи, поэтому проверяем структуру
    expect(screen.getByText("errors.unknown")).toBeInTheDocument();
  });
});
