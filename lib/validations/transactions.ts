import * as z from "zod";

/**
 * Тип функции перевода для валидационных сообщений
 */
export type TranslationFn = (key: string) => string;

/**
 * Создает схему валидации для формы транзакции
 * @param tErrors - Функция перевода для сообщений об ошибках
 * @returns Zod схема для валидации формы транзакции
 */
export function createTransactionFormSchema(tErrors: TranslationFn) {
  return z
    .object({
      amount: z
        .number()
        .min(0.01, tErrors("validation.transactions.amountMin")),
      type: z.enum(["income", "expense", "transfer"]),
      category_id: z.string().optional().or(z.literal("__none__")),
      account_id: z
        .string()
        .min(1, tErrors("validation.transactions.accountRequired")),
      to_account_id: z.string().optional(),
      date: z.date(),
      description: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.type === "transfer") {
          return (
            data.to_account_id &&
            data.to_account_id.length > 0 &&
            data.to_account_id !== data.account_id
          );
        }
        return true;
      },
      {
        message: tErrors("validation.transactions.toAccountDifferent"),
        path: ["to_account_id"],
      }
    );
}

/**
 * Тип данных формы транзакции (выводится из схемы)
 */
export type TransactionFormValues = z.infer<
  ReturnType<typeof createTransactionFormSchema>
>;
