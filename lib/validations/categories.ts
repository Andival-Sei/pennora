import * as z from "zod";

/**
 * Тип функции перевода для валидационных сообщений
 */
export type TranslationFn = (key: string) => string;

/**
 * Создает схему валидации для формы категории
 * @param t - Функция перевода для сообщений об ошибках
 * @returns Zod схема для валидации формы категории
 */
export function createCategoryFormSchema(t: TranslationFn) {
  return z.object({
    name: z
      .string()
      .min(1, t("categories.nameRequired"))
      .max(50, t("categories.nameMaxLength")),
    type: z.enum(["income", "expense"]),
    parent_id: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
  });
}

/**
 * Тип данных формы категории (выводится из схемы)
 */
export type CategoryFormValues = z.infer<
  ReturnType<typeof createCategoryFormSchema>
>;
