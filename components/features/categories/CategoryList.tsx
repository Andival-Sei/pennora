"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTree } from "./CategoryTree";
import { CategoryForm } from "./CategoryForm";
import { useCategories } from "@/lib/hooks/useCategories";
import type { Category, CategoryWithChildren } from "@/lib/types/category";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

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
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryWithChildren | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (category: CategoryWithChildren) => {
    setDeletingCategory(category);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsDeleting(false);
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
          onDelete={handleDeleteClick}
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

      {/* Модалка удаления */}
      <AnimatePresence>
        {deletingCategory && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !isDeleting && setDeletingCategory(null)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {t("categories.deleteTitle")}
                    </h3>
                  </div>
                  {!isDeleting && (
                    <button
                      onClick={() => setDeletingCategory(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <p className="text-muted-foreground mb-6">
                  {t("categories.deleteDescription", {
                    name: deletingCategory.name,
                  })}
                </p>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingCategory(null)}
                    disabled={isDeleting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t("common.loading")}
                      </>
                    ) : (
                      t("common.delete")
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
