import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_PALETTE, type CategoryItem, type Asset } from "./types";

interface SortableCategoryRowProps {
  cat: CategoryItem;
  assets: Asset[];
  editingCatId: number | null;
  editCatName: string;
  setEditCatName: (v: string) => void;
  editCatColorIndex: number;
  setEditCatColorIndex: (v: number) => void;
  saveEditCategory: () => void;
  cancelEditCategory: () => void;
  startEditCategory: (id: number) => void;
  deleteCatConfirm: number | null;
  setDeleteCatConfirm: (v: number | null) => void;
  handleDeleteCategory: (id: number) => void;
}

export function SortableCategoryRow({
  cat, assets, editingCatId, editCatName, setEditCatName,
  editCatColorIndex, setEditCatColorIndex, saveEditCategory, cancelEditCategory,
  startEditCategory, deleteCatConfirm, setDeleteCatConfirm, handleDeleteCategory,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const color = COLOR_PALETTE[cat.colorIndex % COLOR_PALETTE.length];
  const isEditing = editingCatId === cat.id;
  const isDeleting = deleteCatConfirm === cat.id;
  const assetCount = assets.filter((a) => !a.is_sold && a.category === cat.name).length;

  if (isDeleting) {
    return (
      <div ref={setNodeRef} style={style} className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
        <p className="text-sm">
          Delete <span className="font-medium">{cat.name}</span>?
          {assetCount > 0 && (
            <span className="text-muted-foreground"> ({assetCount} asset{assetCount !== 1 && "s"} will keep this category label)</span>
          )}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => { handleDeleteCategory(cat.id); setDeleteCatConfirm(null); }}>
            Delete
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDeleteCatConfirm(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="rounded-md border p-3 space-y-3">
        <Input
          value={editCatName}
          onChange={(e) => setEditCatName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); saveEditCategory(); }
            if (e.key === "Escape") cancelEditCategory();
          }}
          placeholder="Category name"
          autoFocus
        />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Color:</span>
          {COLOR_PALETTE.map((c, idx) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setEditCatColorIndex(idx)}
              className={cn(
                "h-5 w-5 rounded-full transition-all",
                c.dot,
                editCatColorIndex === idx
                  ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                  : "opacity-60 hover:opacity-100"
              )}
              title={c.name}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={saveEditCategory} disabled={!editCatName.trim()}>Save</Button>
          <Button size="sm" variant="ghost" onClick={cancelEditCategory}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-md border px-3 py-2 group bg-background",
        isDragging && "shadow-md"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
          color.bg, color.text
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", color.dot)} />
          {cat.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {assetCount} asset{assetCount !== 1 && "s"}
        </span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEditCategory(cat.id)} title="Edit category">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setDeleteCatConfirm(cat.id)} title="Delete category">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
