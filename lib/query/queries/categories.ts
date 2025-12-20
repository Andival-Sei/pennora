import { createClient } from "@/lib/db/supabase/client";
import type {
  Category,
  CategoryWithChildren,
  CategoryTree,
} from "@/lib/types/category";

/**
 * Загружает все категории пользователя (неархивированные)
 */
export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as Category[];
}

/**
 * Строит дерево категорий из плоского списка
 * Вынесено из хука для переиспользования
 */
export function buildCategoryTree(categories: Category[]): CategoryTree {
  const income: CategoryWithChildren[] = [];
  const expense: CategoryWithChildren[] = [];

  // Создаём мапы для быстрого доступа
  const categoryMap = new Map<string, CategoryWithChildren>();

  // Инициализируем все категории
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Строим дерево
  categories.forEach((cat) => {
    const categoryWithChildren = categoryMap.get(cat.id)!;

    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(categoryWithChildren);
      }
    } else {
      // Корневая категория
      if (cat.type === "income") {
        income.push(categoryWithChildren);
      } else {
        expense.push(categoryWithChildren);
      }
    }
  });

  // Сортируем детей по sort_order
  const sortChildren = (items: CategoryWithChildren[]) => {
    items.sort((a, b) => a.sort_order - b.sort_order);
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        sortChildren(item.children);
      }
    });
  };

  sortChildren(income);
  sortChildren(expense);

  return { income, expense };
}
