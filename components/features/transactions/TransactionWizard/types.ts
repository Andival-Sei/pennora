import type { TransactionItemFormData } from "@/lib/types/transaction";

// Типы транзакций
export type TransactionType = "income" | "expense" | "transfer";

// Режим расхода: простая покупка или чек с позициями
export type ExpenseMode = "simple" | "detailed";

// Метод ввода данных
export type InputMethod = "upload" | "camera" | "manual";

// Шаги wizard
export type WizardStepType =
  | "type"
  | "expense-mode"
  | "input-method"
  | "processing"
  | "form";

// Предзаполненные данные из чека
export interface PrefilledData {
  amount: number;
  date: Date;
  description: string | null;
  categoryId?: string | null;
  items?: TransactionItemFormData[];
}

// Полное состояние wizard
export interface WizardState {
  step: WizardStepType;
  transactionType: TransactionType | null;
  expenseMode: ExpenseMode | null;
  inputMethod: InputMethod | null;
  prefilledData: PrefilledData | null;
}

// Начальное состояние
export const initialWizardState: WizardState = {
  step: "type",
  transactionType: null,
  expenseMode: null,
  inputMethod: null,
  prefilledData: null,
};

// Действия для reducer
export type WizardAction =
  | { type: "SELECT_TYPE"; payload: TransactionType }
  | { type: "SELECT_EXPENSE_MODE"; payload: ExpenseMode }
  | { type: "SELECT_INPUT_METHOD"; payload: InputMethod }
  | { type: "SET_PREFILLED_DATA"; payload: PrefilledData | null }
  | { type: "GO_BACK" }
  | { type: "GO_TO_FORM" }
  | { type: "RESET" };

// Reducer для управления состоянием wizard
export function wizardReducer(
  state: WizardState,
  action: WizardAction
): WizardState {
  switch (action.type) {
    case "SELECT_TYPE": {
      const transactionType = action.payload;

      // Для перевода сразу переходим к форме
      if (transactionType === "transfer") {
        return {
          ...state,
          step: "form",
          transactionType,
          expenseMode: null,
          inputMethod: "manual",
        };
      }

      // Для дохода переходим к выбору метода ввода
      if (transactionType === "income") {
        return {
          ...state,
          step: "input-method",
          transactionType,
          expenseMode: null,
        };
      }

      // Для расхода переходим к выбору режима
      return {
        ...state,
        step: "expense-mode",
        transactionType,
      };
    }

    case "SELECT_EXPENSE_MODE": {
      return {
        ...state,
        step: "input-method",
        expenseMode: action.payload,
      };
    }

    case "SELECT_INPUT_METHOD": {
      const inputMethod = action.payload;

      // Для ручного ввода сразу переходим к форме
      if (inputMethod === "manual") {
        return {
          ...state,
          step: "form",
          inputMethod,
        };
      }

      // Для загрузки/камеры переходим к обработке
      return {
        ...state,
        step: "processing",
        inputMethod,
      };
    }

    case "SET_PREFILLED_DATA": {
      return {
        ...state,
        step: "form",
        prefilledData: action.payload,
      };
    }

    case "GO_TO_FORM": {
      return {
        ...state,
        step: "form",
      };
    }

    case "GO_BACK": {
      switch (state.step) {
        case "expense-mode":
          return {
            ...state,
            step: "type",
            transactionType: null,
          };

        case "input-method":
          // Если это расход, возвращаемся к выбору режима
          if (state.transactionType === "expense") {
            return {
              ...state,
              step: "expense-mode",
              expenseMode: null,
            };
          }
          // Для дохода возвращаемся к выбору типа
          return {
            ...state,
            step: "type",
            transactionType: null,
          };

        case "processing":
          return {
            ...state,
            step: "input-method",
            inputMethod: null,
          };

        case "form":
          // Если был ручной ввод, возвращаемся к выбору метода
          if (state.inputMethod === "manual") {
            return {
              ...state,
              step: "input-method",
              inputMethod: null,
              prefilledData: null,
            };
          }
          // Если была обработка чека, возвращаемся к обработке
          return {
            ...state,
            step: "processing",
            prefilledData: null,
          };

        default:
          return state;
      }
    }

    case "RESET": {
      return initialWizardState;
    }

    default:
      return state;
  }
}

// Вспомогательные функции для определения заголовков и описаний шагов
export function getStepTitle(state: WizardState): string {
  switch (state.step) {
    case "type":
      return "wizard.steps.type";
    case "expense-mode":
      return "wizard.steps.expenseMode";
    case "input-method":
      return "wizard.steps.inputMethod";
    case "processing":
      return state.inputMethod === "upload"
        ? "receipt.dialog.uploadTitle"
        : "receipt.dialog.cameraTitle";
    case "form":
      if (state.transactionType === "transfer") {
        return "wizard.steps.formTransfer";
      }
      if (state.transactionType === "income") {
        return "wizard.steps.formIncome";
      }
      if (state.expenseMode === "detailed") {
        return "wizard.steps.formExpenseDetailed";
      }
      return "wizard.steps.formExpenseSimple";
    default:
      return "wizard.title";
  }
}

// Проверка, можно ли вернуться назад
export function canGoBack(state: WizardState): boolean {
  return state.step !== "type";
}

// Получить номер текущего шага (для индикатора прогресса)
export function getStepNumber(state: WizardState): number {
  switch (state.step) {
    case "type":
      return 1;
    case "expense-mode":
      return 2;
    case "input-method":
      return state.transactionType === "expense" ? 3 : 2;
    case "processing":
      return state.transactionType === "expense" ? 4 : 3;
    case "form":
      if (state.transactionType === "transfer") return 2;
      if (state.transactionType === "income") return 3;
      return 4;
    default:
      return 1;
  }
}

// Получить общее количество шагов
export function getTotalSteps(state: WizardState): number {
  if (state.transactionType === "transfer") return 2;
  if (state.transactionType === "income") return 3;
  if (state.transactionType === "expense") return 4;
  return 4; // По умолчанию для expense
}
