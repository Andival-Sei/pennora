"use client";

import { useState } from "react";
import { ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategoryWithChildren } from "@/lib/types/category";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryItemProps {
  category: CategoryWithChildren;
  level?: number;
  onEdit?: (category: CategoryWithChildren) => void;
  onDelete?: (category: CategoryWithChildren) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

// Популярные иконки для категорий
const defaultIcons: Record<string, keyof typeof LucideIcons> = {
  home: "Home",
  shopping: "ShoppingCart",
  car: "Car",
  food: "UtensilsCrossed",
  heart: "Heart",
  gift: "Gift",
  wallet: "Wallet",
  coffee: "Coffee",
  plane: "Plane",
  gamepad: "Gamepad2",
  book: "Book",
  music: "Music",
  film: "Film",
  briefcase: "Briefcase",
  dollar: "DollarSign",
  trending: "TrendingUp",
};

export function CategoryItem({
  category,
  level = 0,
  onEdit,
  onDelete,
  expanded: externalExpanded,
  onToggleExpand: externalToggleExpand,
}: CategoryItemProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Используем внешнее состояние, если оно передано, иначе внутреннее
  const expanded =
    externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const toggleExpand =
    externalToggleExpand || (() => setInternalExpanded(!internalExpanded));

  const hasChildren = category.children && category.children.length > 0;
  const indent = level * 24; // 24px на уровень

  // Получаем иконку
  let IconComponent: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }> | null = null;
  if (category.icon) {
    const IconName = defaultIcons[category.icon] || category.icon;
    IconComponent =
      (LucideIcons[
        IconName as keyof typeof LucideIcons
      ] as React.ComponentType<{
        className?: string;
        style?: React.CSSProperties;
      }>) || LucideIcons.Folder;
  } else {
    IconComponent =
      category.type === "income"
        ? LucideIcons.TrendingUp
        : LucideIcons.TrendingDown;
  }

  // Цвет категории
  const categoryColor =
    category.color || (category.type === "income" ? "#10b981" : "#ef4444");

  // Обработчик клика на строку категории
  const handleRowClick = (e: React.MouseEvent) => {
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
  };

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
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
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
              onClick={() => onEdit(category)}
              className="h-7 w-7"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(category)}
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
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
