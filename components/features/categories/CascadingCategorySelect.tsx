"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/types/category";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CascadingCategorySelectProps {
  categories: Category[];
  value?: string | null;
  onChange: (value: string | null) => void;
  type?: "income" | "expense";
  excludeCategoryId?: string; // Для исключения категории при редактировании
  placeholder?: string;
  className?: string;
  // Для выбора родителя в форме категории - разрешаем выбирать только листовые категории
  allowIntermediate?: boolean;
  isLoading?: boolean; // Состояние загрузки категорий
}

/**
 * Компонент каскадного выбора категорий
 * Позволяет выбрать категорию по уровням иерархии
 */
export function CascadingCategorySelect({
  categories,
  value,
  onChange,
  type,
  excludeCategoryId,
  placeholder = "Выберите категорию",
  className,
  allowIntermediate = true,
  isLoading = false,
}: CascadingCategorySelectProps) {
  // Массив выбранных ID на каждом уровне (путь от корня до выбранной категории)
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Фильтруем категории по типу если нужно
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    if (type) {
      filtered = filtered.filter((cat) => cat.type === type);
    }

    if (excludeCategoryId) {
      filtered = filtered.filter((cat) => cat.id !== excludeCategoryId);
    }

    return filtered;
  }, [categories, type, excludeCategoryId]);

  // Получаем категории определенного уровня (без родителя или с указанным родителем)
  const getCategoriesAtLevel = (parentId: string | null): Category[] => {
    return filteredCategories.filter(
      (cat) => (cat.parent_id || null) === parentId
    );
  };

  // Получаем категорию по ID
  const getCategoryById = (id: string): Category | undefined => {
    return filteredCategories.find((cat) => cat.id === id);
  };

  // Получаем путь к категории (массив ID от корня до категории)
  const getCategoryPath = (categoryId: string): string[] => {
    const path: string[] = [];
    let currentId: string | null = categoryId;
    const visited = new Set<string>(); // Защита от циклов

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const category = getCategoryById(currentId);
      if (!category) break;

      path.unshift(category.id);
      currentId = category.parent_id || null;
    }

    return path;
  };

  // Инициализация пути при установке value
  useEffect(() => {
    if (value) {
      const path = getCategoryPath(value);
      setSelectedPath(path);
    } else {
      setSelectedPath([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, filteredCategories.length]);

  // Обработка выбора категории на уровне
  const handleLevelChange = (levelIndex: number, categoryId: string) => {
    if (categoryId === "__none__") {
      // Пользователь выбрал "Не выбирать"
      const newPath = selectedPath.slice(0, levelIndex);
      setSelectedPath(newPath);

      // Устанавливаем последнюю категорию из пути как значение
      if (newPath.length > 0) {
        onChange(newPath[newPath.length - 1]);
      } else {
        onChange(null);
      }
    } else {
      // Пользователь выбрал категорию
      const newPath = [...selectedPath.slice(0, levelIndex), categoryId];
      setSelectedPath(newPath);

      // Проверяем, есть ли дочерние категории
      const children = getCategoriesAtLevel(categoryId);

      if (children.length > 0 && allowIntermediate) {
        // Есть дочерние категории - пользователь может продолжить выбор
        // Не устанавливаем значение пока, ждем дальнейшего выбора
      } else {
        // Нет дочерних категорий или allowIntermediate=false - это финальный выбор
        onChange(categoryId);
      }
    }
  };

  // Получаем все уровни для отображения на основе текущего пути
  const getLevelsToRender = (): Array<{
    categories: Category[];
    levelIndex: number;
    parentId: string | null;
  }> => {
    const levels: Array<{
      categories: Category[];
      levelIndex: number;
      parentId: string | null;
    }> = [];

    // Первый уровень - категории без родителя
    let currentParentId: string | null = null;
    let levelIndex = 0;

    while (true) {
      const categoriesAtLevel = getCategoriesAtLevel(currentParentId);

      if (categoriesAtLevel.length === 0) break;

      levels.push({
        categories: categoriesAtLevel,
        levelIndex,
        parentId: currentParentId,
      });

      // Если есть выбранная категория на этом уровне, переходим к следующему
      if (selectedPath[levelIndex]) {
        currentParentId = selectedPath[levelIndex];
        levelIndex++;
      } else {
        break;
      }
    }

    return levels;
  };

  const levels = getLevelsToRender();

  // Получаем отображаемое значение для категории
  const getCategoryName = (categoryId: string): string => {
    const category = getCategoryById(categoryId);
    return category?.name || "";
  };

  // Если загружаются категории, показываем skeleton
  if (isLoading) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded opacity-50" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Если нет категорий, не показываем ничего
  if (filteredCategories.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={className}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        opacity: { duration: 0.2 },
        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <div className="space-y-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {levels.map((level, idx) => {
            const selectedCategoryId = selectedPath[level.levelIndex];
            const isLastLevel = idx === levels.length - 1;
            const selectedCategory = selectedCategoryId
              ? getCategoryById(selectedCategoryId)
              : null;
            const hasChildren = selectedCategory
              ? getCategoriesAtLevel(selectedCategory.id).length > 0
              : false;
            const shouldShowArrow =
              !isLastLevel || (isLastLevel && hasChildren && allowIntermediate);

            return (
              <motion.div
                key={level.levelIndex}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  duration: 0.25,
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { duration: 0.2 },
                  layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1">
                  <Select
                    value={selectedCategoryId || "__none__"}
                    onValueChange={(value) =>
                      handleLevelChange(level.levelIndex, value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          level.levelIndex === 0
                            ? placeholder
                            : "Выберите подкатегорию"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">
                          {level.levelIndex === 0
                            ? "Без категории"
                            : "Не выбирать"}
                        </span>
                      </SelectItem>
                      {level.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Показываем стрелку если нужно показать следующий уровень */}
                <AnimatePresence initial={false}>
                  {shouldShowArrow && selectedCategoryId && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5, x: -10 }}
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="shrink-0"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Показываем дополнительный уровень если выбран последний и есть дети */}
        <AnimatePresence initial={false}>
          {levels.length > 0 &&
            selectedPath.length > 0 &&
            allowIntermediate &&
            (() => {
              const lastSelectedId = selectedPath[selectedPath.length - 1];
              const children = getCategoriesAtLevel(lastSelectedId);

              // Показываем если это последний выбранный элемент и у него есть дети
              if (
                children.length > 0 &&
                selectedPath.length === levels[levels.length - 1].levelIndex + 1
              ) {
                return (
                  <motion.div
                    key="additional-level"
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.25,
                      ease: [0.4, 0, 0.2, 1],
                      opacity: { duration: 0.2 },
                      layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    }}
                    className="flex items-center gap-2"
                  >
                    <Select
                      value="__none__"
                      onValueChange={(value) =>
                        handleLevelChange(selectedPath.length, value)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Выберите подкатегорию (необязательно)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">
                            Не выбирать (остановиться на &quot;
                            {getCategoryName(lastSelectedId)}&quot;)
                          </span>
                        </SelectItem>
                        {children.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                );
              }
              return null;
            })()}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
