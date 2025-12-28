import type { Category } from "@/lib/types/category";
import type { TransactionWithItems } from "@/lib/types/transaction";
import type { CategoryStatistics } from "@/lib/types/statistics";

/**
 * Специальный ID для категории "Без категории"
 */
const UNCATEGORIZED_CATEGORY_ID = "__uncategorized__";

/**
 * Создает виртуальную категорию "Без категории"
 */
function createUncategorizedCategory(
  type: "income" | "expense" | "all"
): Category {
  return {
    id: UNCATEGORIZED_CATEGORY_ID,
    user_id: "", // Не используется в статистике
    name: "Без категории",
    type: type === "all" ? "expense" : type,
    icon: null,
    color: null,
    parent_id: null,
    sort_order: 0,
    is_archived: false,
    is_system: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Получить все ID потомков категории (включая саму категорию)
 */
export function getAllDescendantIds(
  categoryId: string,
  categories: Category[]
): string[] {
  const result: string[] = [categoryId];

  const children = categories.filter((c) => c.parent_id === categoryId);
  for (const child of children) {
    result.push(...getAllDescendantIds(child.id, categories));
  }

  return result;
}

/**
 * Получить корневую категорию для данной категории
 */
export function getRootCategory(
  categoryId: string,
  categories: Category[]
): Category | undefined {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return undefined;

  if (!category.parent_id) return category;

  return getRootCategory(category.parent_id, categories);
}

/**
 * Построить путь категории (например: "Еда > Продукты > Овощи")
 */
export function buildCategoryPath(
  categoryId: string,
  categories: Category[],
  separator = " > "
): string {
  const path: string[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const category = categories.find((c) => c.id === currentId);
    if (!category) break;

    path.unshift(category.name);
    currentId = category.parent_id;
  }

  return path.join(separator);
}

/**
 * Агрегировать транзакции по верхним (root) категориям
 */
export function aggregateByTopCategory(
  transactions: TransactionWithItems[],
  categories: Category[],
  type: "income" | "expense" | "all" = "all"
): CategoryStatistics[] {
  const categoryMap = new Map<
    string,
    { amount: number; count: number; category: Category }
  >();

  for (const transaction of transactions) {
    // Фильтр по типу
    if (type !== "all" && transaction.type !== type) continue;

    // Обрабатываем items если есть, иначе основную транзакцию
    const items =
      transaction.items && transaction.items.length > 0
        ? transaction.items
        : [
            {
              category_id: transaction.category_id,
              category: transaction.category,
              amount: transaction.amount,
            },
          ];

    for (const item of items) {
      // Обработка транзакций без категории
      if (!item.category_id || !item.category) {
        const uncategorizedCategory = createUncategorizedCategory(type);
        const existing = categoryMap.get(UNCATEGORIZED_CATEGORY_ID);
        if (existing) {
          existing.amount += Number(item.amount);
          existing.count += 1;
        } else {
          categoryMap.set(UNCATEGORIZED_CATEGORY_ID, {
            amount: Number(item.amount),
            count: 1,
            category: uncategorizedCategory,
          });
        }
        continue;
      }

      const rootCategory = getRootCategory(item.category_id, categories);
      if (!rootCategory) continue;

      const existing = categoryMap.get(rootCategory.id);
      if (existing) {
        existing.amount += Number(item.amount);
        existing.count += 1;
      } else {
        categoryMap.set(rootCategory.id, {
          amount: Number(item.amount),
          count: 1,
          category: rootCategory,
        });
      }
    }
  }

  const total = Array.from(categoryMap.values()).reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return Array.from(categoryMap.values())
    .map(({ amount, count, category }) => ({
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      parentId: category.parent_id,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      transactionCount: count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Агрегировать транзакции по всем категориям (flat list)
 */
export function aggregateByAllCategories(
  transactions: TransactionWithItems[],
  categories: Category[],
  type: "income" | "expense" | "all" = "all"
): CategoryStatistics[] {
  const categoryMap = new Map<
    string,
    { amount: number; count: number; category: Category }
  >();

  for (const transaction of transactions) {
    if (type !== "all" && transaction.type !== type) continue;

    const items =
      transaction.items && transaction.items.length > 0
        ? transaction.items
        : [
            {
              category_id: transaction.category_id,
              category: transaction.category,
              amount: transaction.amount,
            },
          ];

    for (const item of items) {
      // Обработка транзакций без категории
      if (!item.category_id || !item.category) {
        const uncategorizedCategory = createUncategorizedCategory(type);
        const existing = categoryMap.get(UNCATEGORIZED_CATEGORY_ID);
        if (existing) {
          existing.amount += Number(item.amount);
          existing.count += 1;
        } else {
          categoryMap.set(UNCATEGORIZED_CATEGORY_ID, {
            amount: Number(item.amount),
            count: 1,
            category: uncategorizedCategory,
          });
        }
        continue;
      }

      const category = categories.find((c) => c.id === item.category_id);
      if (!category) continue;

      const existing = categoryMap.get(category.id);
      if (existing) {
        existing.amount += Number(item.amount);
        existing.count += 1;
      } else {
        categoryMap.set(category.id, {
          amount: Number(item.amount),
          count: 1,
          category,
        });
      }
    }
  }

  const total = Array.from(categoryMap.values()).reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return Array.from(categoryMap.values())
    .map(({ amount, count, category }) => ({
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      parentId: category.parent_id,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      transactionCount: count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Агрегировать с иерархией (top-level с дочерними)
 */
export function aggregateWithHierarchy(
  transactions: TransactionWithItems[],
  categories: Category[],
  type: "income" | "expense" | "all" = "all"
): CategoryStatistics[] {
  // Сначала получаем плоский список всех категорий
  const allStats = aggregateByAllCategories(transactions, categories, type);

  // Строим дерево
  const rootStats: CategoryStatistics[] = [];
  const statsMap = new Map<string, CategoryStatistics>();

  // Инициализируем все категории
  for (const stat of allStats) {
    statsMap.set(stat.categoryId, { ...stat, children: [] });
  }

  // Группируем по родителям
  for (const stat of allStats) {
    const statWithChildren = statsMap.get(stat.categoryId)!;

    if (!stat.parentId) {
      // Корневая категория
      rootStats.push(statWithChildren);
    } else {
      // Добавляем к родителю
      const parent = statsMap.get(stat.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(statWithChildren);
      } else {
        // Если родитель не в списке (нет транзакций), добавляем как root
        rootStats.push(statWithChildren);
      }
    }
  }

  // Сортируем
  const sortByAmount = (items: CategoryStatistics[]): CategoryStatistics[] => {
    return items
      .map((item) => ({
        ...item,
        children: item.children ? sortByAmount(item.children) : undefined,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  return sortByAmount(rootStats);
}

/**
 * Получить дочерние категории для drill-down
 */
export function getChildrenStats(
  parentCategoryId: string,
  transactions: TransactionWithItems[],
  categories: Category[],
  type: "income" | "expense" | "all" = "all"
): CategoryStatistics[] {
  const childCategories = categories.filter(
    (c) => c.parent_id === parentCategoryId
  );

  if (childCategories.length === 0) return [];

  // Собираем все ID под каждой дочерней категорией
  const categoryToDescendants = new Map<string, Set<string>>();
  for (const child of childCategories) {
    const descendants = getAllDescendantIds(child.id, categories);
    categoryToDescendants.set(child.id, new Set(descendants));
  }

  const categoryMap = new Map<
    string,
    { amount: number; count: number; category: Category }
  >();

  for (const transaction of transactions) {
    if (type !== "all" && transaction.type !== type) continue;

    const items =
      transaction.items && transaction.items.length > 0
        ? transaction.items
        : [
            {
              category_id: transaction.category_id,
              category: transaction.category,
              amount: transaction.amount,
            },
          ];

    for (const item of items) {
      if (!item.category_id) continue;

      // Находим к какой дочерней категории относится эта транзакция
      for (const [childId, descendants] of categoryToDescendants) {
        if (descendants.has(item.category_id)) {
          const childCategory = childCategories.find((c) => c.id === childId);
          if (!childCategory) continue;

          const existing = categoryMap.get(childId);
          if (existing) {
            existing.amount += Number(item.amount);
            existing.count += 1;
          } else {
            categoryMap.set(childId, {
              amount: Number(item.amount),
              count: 1,
              category: childCategory,
            });
          }
          break;
        }
      }
    }
  }

  const total = Array.from(categoryMap.values()).reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return Array.from(categoryMap.values())
    .map(({ amount, count, category }) => ({
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      parentId: category.parent_id,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      transactionCount: count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Проверить, есть ли у категории дочерние элементы
 */
export function hasChildren(
  categoryId: string,
  categories: Category[]
): boolean {
  return categories.some((c) => c.parent_id === categoryId);
}

/**
 * Получить цвет категории с наследованием от родительской категории
 * Если у категории есть цвет - возвращает его
 * Если нет - рекурсивно ищет цвет у родителя
 * Если родителя нет или у него нет цвета - возвращает дефолтный цвет по типу
 */
export function getCategoryColorWithInheritance(
  category: Category | Pick<Category, "id" | "color" | "parent_id" | "type">,
  categories: Category[],
  defaultIncomeColor = "#10b981",
  defaultExpenseColor = "#ef4444"
): string {
  // Если у категории есть цвет, возвращаем его
  if (category.color) {
    return category.color;
  }

  // Если нет родителя, возвращаем дефолтный цвет по типу
  if (!category.parent_id) {
    return category.type === "income"
      ? defaultIncomeColor
      : defaultExpenseColor;
  }

  // Ищем родительскую категорию
  const parent = categories.find((c) => c.id === category.parent_id);
  if (!parent) {
    // Если родитель не найден, возвращаем дефолтный цвет
    return category.type === "income"
      ? defaultIncomeColor
      : defaultExpenseColor;
  }

  // Рекурсивно ищем цвет у родителя
  return getCategoryColorWithInheritance(
    parent,
    categories,
    defaultIncomeColor,
    defaultExpenseColor
  );
}
