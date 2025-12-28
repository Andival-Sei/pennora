import * as z from "zod";

/**
 * Тип функции перевода для валидационных сообщений
 */
export type TranslationFn = (key: string) => string;

/**
 * Создает схему валидации для позиции транзакции (item)
 * @param tErrors - Функция перевода для сообщений об ошибках
 * @returns Zod схема для валидации позиции
 */
export function createTransactionItemSchema(tErrors: TranslationFn) {
  return z.object({
    category_id: z.string().nullable().optional(),
    amount: z
      .union([
        z.number().min(0.01, tErrors("validation.transactions.amountMin")),
        z.undefined(),
        z.null(),
      ])
      .optional(),
    description: z.string().nullable().optional(),
    sort_order: z.number().optional(),
  });
}

/**
 * Тип данных позиции транзакции (выводится из схемы)
 */
export type TransactionItemFormValues = z.infer<
  ReturnType<typeof createTransactionItemSchema>
>;

/**
 * Создает схему валидации для формы транзакции
 * Поддерживает как простые транзакции, так и транзакции с позициями (items)
 * @param tErrors - Функция перевода для сообщений об ошибках
 * @returns Zod схема для валидации формы транзакции
 */
export function createTransactionFormSchema(tErrors: TranslationFn) {
  const itemSchema = createTransactionItemSchema(tErrors);

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
      // Позиции для split transaction (только для расходов)
      items: z.array(itemSchema).optional(),
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
    )
    .refine(
      (data) => {
        // Если есть items, category_id транзакции должен быть null или __none__
        // (категории только у позиций)
        if (data.items && data.items.length > 0) {
          return (
            !data.category_id ||
            data.category_id === "__none__" ||
            data.category_id === null
          );
        }
        return true;
      },
      {
        message: tErrors("validation.transactions.categoryWithItems"),
        path: ["category_id"],
      }
    );
}

/**
 * Тип данных формы транзакции (выводится из схемы)
 */
export type TransactionFormValues = z.infer<
  ReturnType<typeof createTransactionFormSchema>
>;
