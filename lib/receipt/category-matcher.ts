/**
 * Утилита для автоматического определения категории на основе описания транзакции
 */

import type { Category } from "@/lib/types/category";

/**
 * Ключевые слова для сопоставления с категориями
 */
const categoryKeywords: Record<string, string[]> = {
  // Еда
  Еда: [
    "продукт",
    "еда",
    "продукты",
    "магазин",
    "супермаркет",
    "гипермаркет",
    "ашан",
    "пятёрочка",
    "магнит",
    "перекрёсток",
    "лента",
    "окей",
    "спар",
    "дикси",
    "метро",
    "food",
    "grocery",
    "supermarket",
  ],
  "Рестораны и кафе": [
    "ресторан",
    "кафе",
    "столовая",
    "кофе",
    "кофейня",
    "restaurant",
    "cafe",
    "coffee",
  ],
  "Готовая еда": [
    "самокат",
    "сытно вкусно",
    "ролл",
    "роллы",
    "манты",
    "эчпочмак",
    "пицца",
    "суши",
    "бургер",
    "шашлык",
    "готовая еда",
    "готовые блюда",
    "еда на вынос",
    "кулинария",
    "кулинарный отдел",
    "delivery",
    "ready food",
    "pizza",
    "sushi",
    "roll",
  ],
  // Транспорт
  Топливо: [
    "азс",
    "заправка",
    "бензин",
    "дизель",
    "газ",
    "топливо",
    "нефть",
    "лукойл",
    "роснефть",
    "газпромнефть",
    "shell",
    "bp",
    "fuel",
    "gas",
    "petrol",
  ],
  "Общественный транспорт": [
    "метро",
    "автобус",
    "троллейбус",
    "трамвай",
    "такси",
    "uber",
    "яндекс.такси",
    "яндекс такси",
    "yandex.taxi",
    "transport",
    "bus",
    "taxi",
  ],
  // Жильё
  Аренда: ["аренда", "квартира", "жильё", "rent", "apartment"],
  Коммунальные: [
    "коммунальные",
    "жкх",
    "электричество",
    "газ",
    "вода",
    "отопление",
    "квартплата",
    "мосэнерго",
    "московская объединённая энергетическая",
    "utility",
    "electricity",
    "water",
  ],
  Ремонт: [
    "ремонт",
    "стройматериалы",
    "стройка",
    "строймаркет",
    "leroy merlin",
    "leroymerlin",
    "obi",
    "castorama",
    "ремонт",
    "repair",
    "construction",
  ],
  // Развлечения
  Развлечения: [
    "кино",
    "театр",
    "концерт",
    "клуб",
    "дискотека",
    "игра",
    "игры",
    "развлечения",
    "entertainment",
    "cinema",
    "theater",
    "game",
  ],
  // Здоровье
  Здоровье: [
    "аптека",
    "лекарство",
    "врач",
    "больница",
    "поликлиника",
    "стоматолог",
    "стоматология",
    "медицина",
    "здоровье",
    "pharmacy",
    "medicine",
    "doctor",
    "hospital",
    "health",
  ],
  // Образование
  Образование: [
    "образование",
    "университет",
    "школа",
    "курсы",
    "обучение",
    "education",
    "university",
    "school",
    "course",
  ],
  // Покупки
  Покупки: [
    "покупка",
    "покупки",
    "магазин",
    "шопинг",
    "одежда",
    "обувь",
    "техника",
    "электроника",
    "телефон",
    "смартфон",
    "ноутбук",
    "компьютер",
    "планшет",
    "телевизор",
    "холодильник",
    "стиральная",
    "посудомоечная",
    "микроволновка",
    "пылесос",
    "фонарь",
    "лампа",
    "свет",
    "освещение",
    "мебель",
    "интерьер",
    "dns",
    "м.видео",
    "мвидео",
    "эльдорадо",
    "мегафон",
    "билайн",
    "мтс",
    "tele2",
    "wildberries",
    "ozon",
    "яндекс.маркет",
    "яндекс маркет",
    "aliexpress",
    "shopping",
    "store",
    "shop",
    "clothing",
    "electronics",
  ],
};

/**
 * Определяет категорию на основе описания транзакции
 * @param description - описание транзакции
 * @param categories - список доступных категорий пользователя
 * @param transactionType - тип транзакции (expense или income)
 * @returns ID найденной категории или null
 */
export function matchCategoryByDescription(
  description: string | null,
  categories: Category[],
  transactionType: "expense" | "income" = "expense"
): string | null {
  if (!description) return null;

  const lowerDescription = description.toLowerCase();

  // Фильтруем категории по типу транзакции
  const relevantCategories = categories.filter(
    (cat) => cat.type === transactionType && !cat.is_archived
  );

  // Создаем карту категорий по названию
  const categoryMap = new Map<string, Category>();
  for (const cat of relevantCategories) {
    categoryMap.set(cat.name.toLowerCase(), cat);
  }

  // Ищем совпадения по ключевым словам
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    const categoryLower = categoryName.toLowerCase();
    const category = categoryMap.get(categoryLower);

    if (!category) continue;

    // Проверяем, содержит ли описание ключевые слова
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        return category.id;
      }
    }
  }

  // Если не нашли точное совпадение, пробуем частичное совпадение названий категорий
  for (const category of relevantCategories) {
    const categoryNameLower = category.name.toLowerCase();
    // Проверяем, содержит ли описание название категории
    if (lowerDescription.includes(categoryNameLower)) {
      return category.id;
    }
  }

  return null;
}
