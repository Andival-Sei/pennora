"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/error-state";
import { formatErrorForLogging } from "@/lib/utils/errorHandler";

/**
 * Props для кастомного fallback компонента
 */
export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Props для ErrorBoundary компонента
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Кастомный fallback компонент
   * Если не указан, используется стандартный ErrorState
   */
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  /**
   * Callback, вызываемый при возникновении ошибки
   * Полезно для отправки ошибок в сервисы мониторинга (Sentry и т.д.)
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Массив ключей для автоматического сброса ошибки
   * Error Boundary будет сбрасываться при изменении любого из ключей
   */
  resetKeys?: Array<string | number>;
}

/**
 * Состояние ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Функциональный компонент-обёртка для ErrorState с поддержкой переводов
 * Используется внутри ErrorBoundary для отображения ошибок
 */
function ErrorBoundaryFallback({
  error,
  resetError,
}: ErrorBoundaryFallbackProps) {
  const t = useTranslations("errors.boundary");
  const tErrors = useTranslations("errors");

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorState
        error={error}
        onRetry={resetError}
        title={t("title")}
        description={t("description")}
      />
    </div>
  );
}

/**
 * Error Boundary компонент для обработки ошибок рендеринга React компонентов
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error, info) => console.error(error, info)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @remarks
 * Error Boundary НЕ ловит ошибки в:
 * - Event handlers
 * - Асинхронном коде (setTimeout, промисы)
 * - Server Components
 * - Ошибках в самом Error Boundary
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Обновляем состояние для отображения fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку
    const errorDetails = formatErrorForLogging(error);
    const errorInfoDetails = {
      componentStack: errorInfo.componentStack,
      // В development доступен captureOwnerStack
      ...(process.env.NODE_ENV === "development" &&
        typeof React.captureOwnerStack === "function" && {
          ownerStack: React.captureOwnerStack(),
        }),
    };

    if (process.env.NODE_ENV === "development") {
      // В development выводим полную информацию в console
      console.error("ErrorBoundary caught an error:", error);
      console.error("Error details:", errorDetails);
      console.error("Error info:", errorInfoDetails);
    } else {
      // В production логируем структурированно
      console.error("ErrorBoundary error:", {
        error: errorDetails,
        errorInfo: errorInfoDetails,
      });
    }

    // Сохраняем errorInfo в состоянии для возможного использования
    this.setState({
      errorInfo,
    });

    // Вызываем пользовательский callback, если он указан
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Сбрасываем ошибку при изменении resetKeys
    if (
      this.state.hasError &&
      prevProps.resetKeys &&
      this.props.resetKeys &&
      prevProps.resetKeys.length === this.props.resetKeys.length &&
      prevProps.resetKeys.some(
        (key, index) => key !== this.props.resetKeys![index]
      )
    ) {
      this.resetError();
    }
  }

  /**
   * Сбрасывает состояние ошибки
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorBoundaryFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
