"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/types/category";
import * as LucideIcons from "lucide-react";
import { CascadingCategorySelect } from "./CascadingCategorySelect";

// Расширенный набор иконок для выбора (50+ уникальных иконок)
const availableIcons: Array<{
  name: string;
  key: string;
  component: keyof typeof LucideIcons;
}> = [
  // Основные категории
  { name: "Home", key: "home", component: "Home" },
  { name: "Shopping Cart", key: "shopping", component: "ShoppingCart" },
  { name: "Shopping Bag", key: "shopping-bag", component: "ShoppingBag" },
  { name: "Car", key: "car", component: "Car" },
  { name: "Car Front", key: "car-front", component: "CarFront" },
  { name: "Food", key: "food", component: "UtensilsCrossed" },
  { name: "Utensils", key: "utensils", component: "Utensils" },
  { name: "Coffee", key: "coffee", component: "Coffee" },
  { name: "Heart", key: "heart", component: "Heart" },
  { name: "Heart Pulse", key: "heart-pulse", component: "HeartPulse" },
  { name: "Gift", key: "gift", component: "Gift" },
  { name: "Wallet", key: "wallet", component: "Wallet" },
  { name: "Credit Card", key: "credit-card", component: "CreditCard" },
  { name: "Banknote", key: "banknote", component: "Banknote" },
  { name: "Dollar Sign", key: "dollar", component: "DollarSign" },
  { name: "Trending Up", key: "trending", component: "TrendingUp" },
  { name: "Trending Down", key: "trending-down", component: "TrendingDown" },

  // Транспорт
  { name: "Plane", key: "plane", component: "Plane" },
  { name: "Train", key: "train", component: "Train" },
  { name: "Bike", key: "bike", component: "Bike" },
  { name: "Bus", key: "bus", component: "Bus" },
  { name: "Fuel", key: "fuel", component: "Fuel" },

  // Развлечения и хобби
  { name: "Gamepad", key: "gamepad", component: "Gamepad2" },
  { name: "Music", key: "music", component: "Music" },
  { name: "Film", key: "film", component: "Film" },
  { name: "Camera", key: "camera", component: "Camera" },
  { name: "Palette", key: "palette", component: "Palette" },
  { name: "Dumbbell", key: "dumbbell", component: "Dumbbell" },
  { name: "Trophy", key: "trophy", component: "Trophy" },

  // Образование и работа
  { name: "Book", key: "book", component: "Book" },
  { name: "Graduation Cap", key: "graduation-cap", component: "GraduationCap" },
  { name: "School", key: "school", component: "School" },
  { name: "Briefcase", key: "briefcase", component: "Briefcase" },
  { name: "Building", key: "building", component: "Building" },
  { name: "File Text", key: "file-text", component: "FileText" },
  { name: "Calculator", key: "calculator", component: "Calculator" },

  // Здоровье и красота
  { name: "Stethoscope", key: "stethoscope", component: "Stethoscope" },
  { name: "Pill", key: "pill", component: "Pill" },
  { name: "Scissors", key: "scissors", component: "Scissors" },
  { name: "Sparkles", key: "sparkles", component: "Sparkles" },

  // Семья и домашние животные
  { name: "Baby", key: "baby", component: "Baby" },
  { name: "Dog", key: "dog", component: "Dog" },
  { name: "Cat", key: "cat", component: "Cat" },

  // Технологии и связь
  { name: "Smartphone", key: "smartphone", component: "Smartphone" },
  { name: "Laptop", key: "laptop", component: "Laptop" },
  { name: "Wifi", key: "wifi", component: "Wifi" },
  { name: "Phone", key: "phone", component: "Phone" },
  { name: "Mail", key: "mail", component: "Mail" },

  // Прочее
  { name: "Tag", key: "tag", component: "Tag" },
  { name: "Star", key: "star", component: "Star" },
  { name: "Bell", key: "bell", component: "Bell" },
  { name: "Calendar", key: "calendar", component: "Calendar" },
  { name: "Clock", key: "clock", component: "Clock" },
  { name: "Map Pin", key: "map-pin", component: "MapPin" },
  { name: "Package", key: "package", component: "Package" },
  { name: "Box", key: "box", component: "Box" },
  { name: "Shopping", key: "shopping-alt", component: "ShoppingCart" },
  { name: "Receipt", key: "receipt", component: "Receipt" },
  { name: "Store", key: "store", component: "Store" },
  { name: "Zap", key: "zap", component: "Zap" },
  { name: "Droplet", key: "droplet", component: "Droplet" },
  { name: "Flame", key: "flame", component: "Flame" },
  { name: "TreePine", key: "tree-pine", component: "TreePine" },
  { name: "Shirt", key: "shirt", component: "Shirt" },
  { name: "Footprints", key: "footprints", component: "Footprints" },
  { name: "Umbrella", key: "umbrella", component: "Umbrella" },
  { name: "Sun", key: "sun", component: "Sun" },
  { name: "Moon", key: "moon", component: "Moon" },

  // Еда и продукты
  { name: "Apple", key: "apple", component: "Apple" },
  { name: "Cherry", key: "cherry", component: "Cherry" },
  { name: "Circle", key: "circle", component: "Circle" },
];

// Предустановленные цвета
const presetColors = [
  { name: "Green", value: "#10b981" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Yellow", value: "#eab308" },
  { name: "Indigo", value: "#6366f1" },
];

const categorySchema = z.object({
  name: z
    .string()
    .min(1, "categories.nameRequired")
    .max(50, "categories.nameMaxLength"),
  type: z.enum(["income", "expense"]),
  parent_id: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  parentCategories?: Category[];
  onSubmit: (data: CategoryFormData) => Promise<Category | null>;
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  parentCategories = [],
  onSubmit,
}: CategoryFormProps) {
  const t = useTranslations();
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      parent_id: null,
      icon: null,
      color: null,
    },
  });

  // Сбрасываем форму при открытии/закрытии
  useEffect(() => {
    if (open) {
      if (category) {
        reset({
          name: category.name,
          type: category.type,
          parent_id: category.parent_id || null,
          icon: category.icon || null,
          color: category.color || null,
        });
      } else {
        reset({
          name: "",
          type: "expense",
          parent_id: null,
          icon: null,
          color: null,
        });
      }
    }
  }, [open, category, reset]);

  const onFormSubmit = async (data: CategoryFormData) => {
    const result = await onSubmit({
      name: data.name,
      type: data.type,
      parent_id: data.parent_id || null,
      icon: data.icon || null,
      color: data.color || null,
    });

    if (result) {
      onOpenChange(false);
      reset();
    }
  };

  // Фильтруем родительские категории (исключаем текущую категорию)
  // При создании фильтруем по типу из формы, при редактировании - по типу категории
  const formType = category?.type || "expense";
  const availableParents = parentCategories.filter(
    (cat) => cat.id !== category?.id && cat.type === formType
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("categories.edit") : t("categories.add")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("categories.editDescription")
              : t("categories.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2"
        >
          {/* Название */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("categories.name")}</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={t("categories.namePlaceholder")}
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          {/* Тип */}
          <div className="space-y-2">
            <Label htmlFor="type">{t("categories.type")}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditing} // Нельзя менять тип при редактировании
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      {t("categories.income")}
                    </SelectItem>
                    <SelectItem value="expense">
                      {t("categories.expense")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Родительская категория */}
          {availableParents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_id">{t("categories.parent")}</Label>
              <Controller
                name="parent_id"
                control={control}
                render={({ field }) => (
                  <CascadingCategorySelect
                    categories={parentCategories}
                    value={field.value || null}
                    onChange={field.onChange}
                    type={formType}
                    excludeCategoryId={category?.id}
                    placeholder={t("categories.noParent")}
                    allowIntermediate={true}
                  />
                )}
              />
            </div>
          )}

          {/* Иконка */}
          <div className="space-y-2">
            <Label>{t("categories.icon")}</Label>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="max-h-[200px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange(null)}
                      className={`flex h-10 items-center justify-center rounded-md border transition-colors ${
                        !field.value
                          ? "border-primary bg-primary/10"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      <span className="text-xs">{t("categories.noIcon")}</span>
                    </button>
                    {availableIcons.map((icon) => {
                      const IconComponent = LucideIcons[
                        icon.component
                      ] as React.ComponentType<{
                        className?: string;
                      }>;
                      return (
                        <button
                          key={icon.key}
                          type="button"
                          onClick={() => field.onChange(icon.key)}
                          className={`flex h-10 items-center justify-center rounded-md border transition-colors ${
                            field.value === icon.key
                              ? "border-primary bg-primary/10"
                              : "border-input hover:bg-accent"
                          }`}
                        >
                          {IconComponent && (
                            <IconComponent className="h-5 w-5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            />
          </div>

          {/* Цвет */}
          <div className="space-y-2">
            <Label>{t("categories.color")}</Label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => field.onChange(null)}
                    className={`h-10 w-10 rounded-md border-2 transition-all ${
                      !field.value
                        ? "border-primary scale-110"
                        : "border-input hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: field.value || "#e5e7eb",
                    }}
                    title={t("categories.noColor")}
                  />
                  {presetColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => field.onChange(color.value)}
                      className={`h-10 w-10 rounded-md border-2 transition-all ${
                        field.value === color.value
                          ? "border-primary scale-110"
                          : "border-input hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
