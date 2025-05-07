"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  useCreateCategory,
  useDeleteCategory,
  useGetCategories,
  useUpdateCategory,
} from "@/services/api/categoryApi";
import LoadingPopup from "@/components/loading-popup";

export default function CategoryList() {
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(
    null
  );
  const {
    mutate: addCategory,
    isPending: addPending,
    isSuccess: addSuccess,
  } = useCreateCategory();
  const { mutate: updateCategory, isPending: updatePending } =
    useUpdateCategory();
  const { mutate: deleteCategory, isPending: deletePending } =
    useDeleteCategory();
  const { data: categories } = useGetCategories();

  useEffect(() => {
    if (updatePending) setEditingCategory(null);
  }, [updatePending]);

  useEffect(() => {
    if (addSuccess) setNewCategory("");
  }, [addSuccess]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    addCategory({ name: newCategory });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    updateCategory(editingCategory);
  };

  const handleDeleteCategory = async (id: string) => {
    deleteCategory(id);
  };

  const isLoading = addPending || updatePending || deletePending;

  return (
    <>
      <LoadingPopup isLoading={isLoading} />
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  {editingCategory?.id === category.id ? (
                    <Input
                      value={editingCategory?.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      }
                      className="max-w-sm"
                    />
                  ) : (
                    category.name
                  )}
                </TableCell>
                <TableCell>
                  {editingCategory?.id === category.id ? (
                    <Button onClick={handleUpdateCategory} size="sm">
                      Save
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setEditingCategory(category)}
                        size="icon"
                        variant="outline"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit category</span>
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(category?.id || "")}
                        size="icon"
                        variant="outline"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete category</span>
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
