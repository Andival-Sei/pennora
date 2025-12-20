"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTree } from "./CategoryTree";
import { CategoryForm } from "./CategoryForm";
import { useCategories } from "@/lib/hooks/useCategories";
import type { Category, CategoryWithChildren } from "@/lib/types/category";
import { useTranslations } from "next-intl";

// Тип данных формы категории (совместим с CategoryForm)
interface CategoryFormData {
  name: string;
  type: "income" | "expense";
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
}

export function CategoryList() {
  const t = useTranslations();
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    buildTree,
  } = useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryWithChildren | null>(null);

  const tree = buildTree();

  const handleCreate = async (data: CategoryFormData) => {
    const result = await createCategory({
      name: data.name,
      type: data.type,
      parent_id: data.parent_id || null,
      icon: data.icon || null,
      color: data.color || null,
    });
    if (result) {
      setIsFormOpen(false);
    }
    return result;
  };

  const handleEdit = async (data: CategoryFormData) => {
    if (!editingCategory) return null;
    const result = await updateCategory(editingCategory.id, {
      name: data.name,
      type: data.type,
      parent_id: data.parent_id || null,
      icon: data.icon || null,
      color: data.color || null,
    });
    if (result) {
      setEditingCategory(null);
      return result;
    }
    return null;
  };

  const handleDelete = async (category: CategoryWithChildren) => {
    if (
      window.confirm(t("categories.deleteConfirm", { name: category.name }))
    ) {
      await deleteCategory(category.id);
    }
  };

  const handleEditClick = (category: CategoryWithChildren) => {
    setEditingCategory(category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {t("errors.databaseError")}: {error}
      </div>
    );
  }

  const hasCategories = categories.length > 0;

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("categories.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("categories.description")}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("categories.add")}
        </Button>
      </div>

      {/* Список категорий */}
      {hasCategories ? (
        <CategoryTree
          tree={tree}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("categories.empty")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("categories.emptyDescription")}
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            {t("categories.addFirst")}
          </Button>
        </div>
      )}

      {/* Форма создания */}
      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        parentCategories={categories}
        onSubmit={handleCreate}
      />

      {/* Форма редактирования */}
      <CategoryForm
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        category={editingCategory as Category | null}
        parentCategories={categories}
        onSubmit={handleEdit}
      />
    </div>
  );
}
