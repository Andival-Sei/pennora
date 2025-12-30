"use client";

import { useReducer, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query/keys";
import { fetchAccounts } from "@/lib/query/queries/accounts";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/query";
import { useCategories } from "@/lib/hooks/useCategories";
import { matchCategoryByDescription } from "@/lib/receipt/category-matcher";
import type { ReceiptProcessingResult } from "@/lib/receipt/types";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

// Lazy load компоненты обработки чеков для уменьшения initial bundle size
// Загружаются только при выборе соответствующего метода ввода
const ReceiptUploader = dynamic(
  () =>
    import("../ReceiptUploader").then((mod) => ({
      default: mod.ReceiptUploader,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <LoadingSkeleton width="100%" height="200px" rounded="lg" />
        <LoadingSkeleton width="100%" height="40px" rounded="md" />
      </div>
    ),
  }
);

const ReceiptCamera = dynamic(
  () =>
    import("../ReceiptCamera").then((mod) => ({
      default: mod.ReceiptCamera,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <LoadingSkeleton width="100%" height="300px" rounded="lg" />
        <LoadingSkeleton width="100%" height="40px" rounded="md" />
      </div>
    ),
  }
);
import {
  IncomeForm,
  ExpenseSimpleForm,
  ExpenseDetailedForm,
  TransferForm,
} from "../TransactionForms";

import { TransactionTypeStep } from "./TransactionTypeStep";
import { ExpenseModeStep } from "./ExpenseModeStep";
import { InputMethodStep } from "./InputMethodStep";
import { WizardHeader } from "./WizardHeader";
import {
  wizardReducer,
  initialWizardState,
  getStepTitle,
  type TransactionType,
  type ExpenseMode,
  type InputMethod,
  type PrefilledData,
} from "./types";

interface TransactionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
  }),
};

/**
 * Wizard для создания транзакций
 * Пошаговый интерфейс с выбором типа, режима расхода и способа ввода
 */
export function TransactionWizard({
  open,
  onOpenChange,
  onSuccess,
}: TransactionWizardProps) {
  const t = useTranslations("transactions");
  const tReceipt = useTranslations("receipt");
  const { categories } = useCategories();

  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

  // Загружаем счета для проверки количества
  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: fetchAccounts,
    staleTime: QUERY_STALE_TIME.ACCOUNTS,
    gcTime: QUERY_GC_TIME.ACCOUNTS,
  });

  // Направление анимации (для slide эффекта)
  const getDirection = useCallback(() => {
    return 1; // Всегда вперёд, при возврате reducer изменит состояние
  }, []);

  // Обработчики выбора
  const handleSelectType = useCallback((type: TransactionType) => {
    dispatch({ type: "SELECT_TYPE", payload: type });
  }, []);

  const handleSelectExpenseMode = useCallback((mode: ExpenseMode) => {
    dispatch({ type: "SELECT_EXPENSE_MODE", payload: mode });
  }, []);

  const handleSelectInputMethod = useCallback((method: InputMethod) => {
    dispatch({ type: "SELECT_INPUT_METHOD", payload: method });
  }, []);

  const handleBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  // Обработка чека
  const handleReceiptProcessed = useCallback(
    (result: ReceiptProcessingResult) => {
      if (result.success && result.data) {
        // Определяем категорию на основе описания
        const suggestedCategoryId = result.data.description
          ? matchCategoryByDescription(
              result.data.description,
              categories,
              "expense"
            )
          : null;

        // Создаём items из чека
        let items: PrefilledData["items"];
        if (result.data.items && result.data.items.length > 0) {
          items = result.data.items.map((item, index) => {
            const itemCategoryId = matchCategoryByDescription(
              item.name,
              categories,
              "expense"
            );
            return {
              category_id: itemCategoryId || null,
              amount: item.price,
              description: item.name,
              sort_order: index,
            };
          });
        }

        const prefilledData: PrefilledData = {
          amount: result.data.amount,
          date: result.data.date,
          description: result.data.description,
          categoryId: suggestedCategoryId,
          items: items && items.length > 0 ? items : undefined,
        };

        dispatch({ type: "SET_PREFILLED_DATA", payload: prefilledData });
      } else {
        const errorMessage =
          result.error || tReceipt("errors.processingFailed");
        toast.error(errorMessage, {
          description: result.rawText
            ? tReceipt("errors.fallbackToManual")
            : undefined,
          duration: 5000,
        });

        // Переходим к форме без предзаполненных данных
        dispatch({ type: "GO_TO_FORM" });
      }
    },
    [categories, tReceipt]
  );

  const handleSuccess = useCallback(() => {
    dispatch({ type: "RESET" });
    onOpenChange(false);
    onSuccess?.();
  }, [onOpenChange, onSuccess]);

  const handleDialogOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        dispatch({ type: "RESET" });
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  // Получаем заголовок текущего шага
  const stepTitleKey = getStepTitle(state);
  const stepTitle = stepTitleKey.startsWith("receipt.")
    ? tReceipt(stepTitleKey.replace("receipt.", ""))
    : t(stepTitleKey);

  // Рендер текущего шага
  const renderStep = () => {
    switch (state.step) {
      case "type":
        return (
          <TransactionTypeStep
            onSelect={handleSelectType}
            accountsCount={accounts.length}
          />
        );

      case "expense-mode":
        return <ExpenseModeStep onSelect={handleSelectExpenseMode} />;

      case "input-method":
        return <InputMethodStep onSelect={handleSelectInputMethod} />;

      case "processing":
        if (state.inputMethod === "upload") {
          return (
            <ReceiptUploader
              onProcessed={handleReceiptProcessed}
              onCancel={handleBack}
            />
          );
        }
        if (state.inputMethod === "camera") {
          return (
            <ReceiptCamera
              onProcessed={handleReceiptProcessed}
              onCancel={handleBack}
            />
          );
        }
        return null;

      case "form":
        return renderForm();

      default:
        return null;
    }
  };

  // Рендер формы в зависимости от типа транзакции
  const renderForm = () => {
    const { transactionType, expenseMode, prefilledData } = state;

    if (transactionType === "transfer") {
      return <TransferForm onSuccess={handleSuccess} />;
    }

    if (transactionType === "income") {
      return (
        <IncomeForm prefilledData={prefilledData} onSuccess={handleSuccess} />
      );
    }

    if (transactionType === "expense") {
      if (expenseMode === "detailed") {
        return (
          <ExpenseDetailedForm
            prefilledData={prefilledData}
            onSuccess={handleSuccess}
          />
        );
      }
      return (
        <ExpenseSimpleForm
          prefilledData={prefilledData}
          onSuccess={handleSuccess}
        />
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("wizard.title")}</DialogTitle>
          <DialogDescription>{t("wizard.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Заголовок с навигацией */}
          <WizardHeader state={state} title={stepTitle} onBack={handleBack} />

          {/* Контент шага с анимацией */}
          <div className="overflow-hidden w-full px-1 pt-1 pb-6">
            <AnimatePresence mode="wait" custom={getDirection()}>
              <motion.div
                key={`${state.step}-${state.transactionType}-${state.expenseMode}`}
                custom={getDirection()}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
