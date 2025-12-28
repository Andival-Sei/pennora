import * as z from "zod";

/**
 * Тип функции перевода для валидационных сообщений
 */
export type TranslationFn = (key: string) => string;

/**
 * Создает схему валидации для валюты
 * @returns Zod схема для валидации валюты
 */
export function createCurrencySchema() {
  return z.object({
    currency: z.enum(["RUB", "USD", "EUR"]),
  });
}

/**
 * Создает схему валидации для карточного счета
 * @param t - Функция перевода для сообщений об ошибках
 * @returns Zod схема для валидации карточного счета
 */
export function createCardAccountSchema(t: TranslationFn) {
  return z.object({
    bank: z.string().min(1, t("card.bankRequired")),
    name: z.string().min(1, t("card.nameRequired")),
    balance: z.string().refine((val) => {
      const num = parseFloat(val.replace(",", "."));
      return !isNaN(num) && num >= 0;
    }, t("card.balanceInvalid")),
  });
}

/**
 * Создает схему валидации для наличного счета
 * @param t - Функция перевода для сообщений об ошибках
 * @returns Zod схема для валидации наличного счета
 */
export function createCashAccountSchema(t: TranslationFn) {
  return z.object({
    balance: z.string().refine((val) => {
      const num = parseFloat(val.replace(",", "."));
      return !isNaN(num) && num >= 0;
    }, t("cash.balanceInvalid")),
  });
}

/**
 * Схема валидации для полного счета (для создания/обновления)
 */
export function createAccountSchema() {
  return z.object({
    name: z.string().min(1),
    type: z.enum(["card", "cash", "savings"]),
    currency: z.enum(["RUB", "USD", "EUR"]),
    balance: z.number().min(0),
    bank: z.string().optional(),
  });
}

/**
 * Типы данных форм (выводятся из схем)
 */
export type CurrencyFormValues = z.infer<
  ReturnType<typeof createCurrencySchema>
>;
export type CardAccountFormValues = z.infer<
  ReturnType<typeof createCardAccountSchema>
>;
export type CashAccountFormValues = z.infer<
  ReturnType<typeof createCashAccountSchema>
>;
export type AccountFormValues = z.infer<ReturnType<typeof createAccountSchema>>;
