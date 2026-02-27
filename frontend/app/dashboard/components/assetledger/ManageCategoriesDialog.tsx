"use client";

import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MAX_CATEGORIES, type CategoryItem, type Asset } from "./types";
import { SortableCategoryRow } from "./SortableCategoryRow";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryItem[];
  assets: Asset[];
  onReorder: (reordered: CategoryItem[]) => void;
  onSave: (id: number, name: string, colorIndex: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function ManageCategoriesDialog({
  open, onOpenChange, categories, assets, onReorder, onSave, onDelete,
}: ManageCategoriesDialogProps) {
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColorIndex, setEditCatColorIndex] = useState(0);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function cancelEdit() {
    setEditingCatId(null);
    setEditCatName("");
    setEditCatColorIndex(0);
  }

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen);
    if (!isOpen) {
      cancelEdit();
      setDeleteCatConfirm(null);
    }
  }

  function startEdit(catId: number) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setEditingCatId(catId);
    setEditCatName(cat.name);
    setEditCatColorIndex(cat.colorIndex);
  }

  async function handleSave() {
    if (editingCatId === null) return;
    const trimmed = editCatName.trim();
    if (!trimmed) return;
    const duplicate = categories.some((c) => c.id !== editingCatId && c.name === trimmed);
    if (duplicate) return;
    try {
      await onSave(editingCatId, trimmed, editCatColorIndex);
      cancelEdit();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  }

  async function handleDelete(catId: number) {
    try {
      await onDelete(catId);
      setDeleteCatConfirm(null);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(categories, oldIndex, newIndex));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Drag to reorder, edit names &amp; colors, or remove. {categories.length}/{MAX_CATEGORIES} used.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No categories yet. Create one when adding an asset.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map((cat) => (
                  <SortableCategoryRow
                    key={cat.id}
                    cat={cat}
                    assets={assets}
                    editingCatId={editingCatId}
                    editCatName={editCatName}
                    setEditCatName={setEditCatName}
                    editCatColorIndex={editCatColorIndex}
                    setEditCatColorIndex={setEditCatColorIndex}
                    saveEditCategory={handleSave}
                    cancelEditCategory={cancelEdit}
                    startEditCategory={startEdit}
                    deleteCatConfirm={deleteCatConfirm}
                    setDeleteCatConfirm={setDeleteCatConfirm}
                    handleDeleteCategory={handleDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
