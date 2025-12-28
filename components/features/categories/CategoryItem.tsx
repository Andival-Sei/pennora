"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategoryWithChildren, Category } from "@/lib/types/category";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCategoryColorWithInheritance } from "@/lib/utils/category-hierarchy";

interface CategoryItemProps {
  category: CategoryWithChildren;
  level?: number;
  onEdit?: (category: CategoryWithChildren) => void;
  onDelete?: (category: CategoryWithChildren) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  allCategories?: Category[]; // Плоский список всех категорий для наследования цветов
}

// Расширенный набор иконок для категорий (поддержка всех доступных иконок)
const defaultIcons: Record<string, keyof typeof LucideIcons> = {
  // Основные категории
  home: "Home",
  shopping: "ShoppingCart",
  "shopping-bag": "ShoppingBag",
  car: "Car",
  "car-front": "CarFront",
  food: "UtensilsCrossed",
  utensils: "Utensils",
  heart: "Heart",
  "heart-pulse": "HeartPulse",
  gift: "Gift",
  wallet: "Wallet",
  "credit-card": "CreditCard",
  banknote: "Banknote",
  coffee: "Coffee",
  dollar: "DollarSign",
  trending: "TrendingUp",
  "trending-down": "TrendingDown",

  // Транспорт
  plane: "Plane",
  train: "Train",
  bike: "Bike",
  bus: "Bus",
  fuel: "Fuel",

  // Развлечения и хобби
  gamepad: "Gamepad2",
  music: "Music",
  film: "Film",
  camera: "Camera",
  palette: "Palette",
  dumbbell: "Dumbbell",
  trophy: "Trophy",

  // Образование и работа
  book: "Book",
  "graduation-cap": "GraduationCap",
  school: "School",
  briefcase: "Briefcase",
  building: "Building",
  "file-text": "FileText",
  calculator: "Calculator",

  // Здоровье и красота
  stethoscope: "Stethoscope",
  pill: "Pill",
  scissors: "Scissors",
  sparkles: "Sparkles",

  // Семья и домашние животные
  baby: "Baby",
  dog: "Dog",
  cat: "Cat",

  // Технологии и связь
  smartphone: "Smartphone",
  laptop: "Laptop",
  wifi: "Wifi",
  phone: "Phone",
  mail: "Mail",

  // Прочее
  tag: "Tag",
  star: "Star",
  bell: "Bell",
  calendar: "Calendar",
  clock: "Clock",
  "map-pin": "MapPin",
  package: "Package",
  box: "Box",
  receipt: "Receipt",
  store: "Store",
  zap: "Zap",
  droplet: "Droplet",
  flame: "Flame",
  "tree-pine": "TreePine",
  shirt: "Shirt",
  footprints: "Footprints",
  umbrella: "Umbrella",
  sun: "Sun",
  moon: "Moon",
};

export const CategoryItem = memo(function CategoryItem({
  category,
  level = 0,
  onEdit,
  onDelete,
  expanded: externalExpanded,
  onToggleExpand: externalToggleExpand,
  allCategories = [],
}: CategoryItemProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Используем внешнее состояние, если оно передано, иначе внутреннее
  const expanded =
    externalExpanded !== undefined ? externalExpanded : internalExpanded;

  const toggleInternalExpand = useCallback(() => {
    setInternalExpanded((prev) => !prev);
  }, []);

  const toggleExpand = externalToggleExpand || toggleInternalExpand;

  const hasChildren = useMemo(
    () => category.children && category.children.length > 0,
    [category.children]
  );
  const indent = level * 24; // 24px на уровень

  // Мемоизируем иконку
  const IconComponent = useMemo(() => {
    if (category.icon) {
      const IconName = defaultIcons[category.icon] || category.icon;
      return (
        (LucideIcons[
          IconName as keyof typeof LucideIcons
        ] as React.ComponentType<{
          className?: string;
          style?: React.CSSProperties;
        }>) || LucideIcons.Folder
      );
    } else {
      return category.type === "income"
        ? LucideIcons.TrendingUp
        : LucideIcons.TrendingDown;
    }
  }, [category.icon, category.type]);

  // Мемоизируем цвет категории с наследованием от родителя
  const categoryColor = useMemo(() => {
    if (allCategories.length > 0) {
      return getCategoryColorWithInheritance(category, allCategories);
    }
    // Fallback для обратной совместимости
    return (
      category.color || (category.type === "income" ? "#10b981" : "#ef4444")
    );
  }, [category, allCategories]);

  // Мемоизируем обработчики
  const handleEditClick = useCallback(() => {
    if (onEdit) {
      onEdit(category);
    }
  }, [onEdit, category]);

  const handleDeleteClick = useCallback(() => {
    if (onDelete) {
      onDelete(category);
    }
  }, [onDelete, category]);

  const handleToggleExpandClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpand();
    },
    [toggleExpand]
  );

  // Обработчик клика на строку категории
  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      // Если клик был на кнопке действий (edit/delete) или на стрелке, не раскрываем
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest('[role="button"]') ||
        target.closest(".flex.items-center.gap-1")
      ) {
        return;
      }
      // Раскрываем только если есть подкатегории
      if (hasChildren) {
        toggleExpand();
      }
    },
    [hasChildren, toggleExpand]
  );

  return (
    <div className="group">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
          "hover:bg-accent/50",
          level > 0 && "ml-4",
          hasChildren && "cursor-pointer"
        )}
        style={{ paddingLeft: `${12 + indent}px` }}
        onClick={handleRowClick}
      >
        {/* Кнопка раскрытия для категорий с детьми */}
        {hasChildren ? (
          <button
            onClick={handleToggleExpandClick}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-accent"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <div className="h-6 w-6" /> // Spacer для выравнивания
        )}

        {/* Иконка категории */}
        {IconComponent && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <IconComponent
              className="h-4 w-4"
              style={{ color: categoryColor }}
            />
          </div>
        )}

        {/* Название категории */}
        <span className="flex-1 text-sm font-medium">{category.name}</span>

        {/* Действия */}
        <div
          className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleEditClick}
              className="h-7 w-7"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && !category.is_system && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDeleteClick}
              className="h-7 w-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Дочерние категории с плавной анимацией */}
      <AnimatePresence initial={false}>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1], // ease-in-out
            }}
            style={{ overflow: "hidden" }}
          >
            <div>
              {category.children!.map((child) => (
                <CategoryItem
                  key={child.id}
                  category={child}
                  level={level + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  // Для вложенных уровней используем внутреннее состояние
                  expanded={undefined}
                  onToggleExpand={undefined}
                  allCategories={allCategories}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
