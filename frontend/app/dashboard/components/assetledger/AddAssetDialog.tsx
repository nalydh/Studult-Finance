"use client";

import React, { useState, FormEvent } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { COLOR_PALETTE, MAX_CATEGORIES, type CategoryItem } from "./types";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryItem[];
  selectedTab: string;
  onSubmit: (data: { name: string; category: string; purchase_price: number; market_value: number | null; date_acquired: string }) => Promise<void>;
  onCreateCategory: (name: string, colorIndex: number) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export function AddAssetDialog({
  open, onOpenChange, categories, selectedTab, onSubmit, onCreateCategory, onDeleteCategory,
}: AddAssetDialogProps) {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newMarketValue, setNewMarketValue] = useState("");
  const [newDateAcquired, setNewDateAcquired] = useState<Date>(new Date());
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newCategoryColorIndex, setNewCategoryColorIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setNewName("");
    setNewCategory("");
    setNewPrice("");
    setNewMarketValue("");
    setNewDateAcquired(new Date());
    setIsCreatingCategory(false);
    setNewCategoryInput("");
    setNewCategoryColorIndex(0);
    setIsSubmitting(false);
  }

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen);
    if (isOpen && selectedTab !== "All") {
      setNewCategory(selectedTab);
    }
    if (!isOpen) {
      resetForm();
    }
  }

  async function handleCreateCategory() {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.length >= MAX_CATEGORIES) return;

    if (categories.some((c) => c.name === trimmed)) {
      setNewCategory(trimmed);
      setNewCategoryInput("");
      setNewCategoryColorIndex(0);
      setIsCreatingCategory(false);
      return;
    }

    try {
      await onCreateCategory(trimmed, newCategoryColorIndex);
      setNewCategory(trimmed);
      setNewCategoryInput("");
      setNewCategoryColorIndex(0);
      setIsCreatingCategory(false);
    } catch (error) {
      console.error("Error creating category:", error);
    }
  }

  async function handleDeleteCategory(catId: number) {
    const cat = categories.find((c) => c.id === catId);
    try {
      await onDeleteCategory(catId);
      if (cat && newCategory === cat.name) setNewCategory("");
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCategory || !newPrice || !newDateAcquired || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: newName,
        category: newCategory,
        purchase_price: parseFloat(newPrice),
        market_value: newMarketValue ? parseFloat(newMarketValue) : null,
        date_acquired: newDateAcquired.toISOString(),
      });
      resetForm();
    } catch (error) {
      console.error("Error adding asset:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset-name">Name</Label>
            <Input
              id="asset-name"
              placeholder="e.g. MacBook Pro"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            {isCreatingCategory ? (
              categories.length >= MAX_CATEGORIES ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">
                    You&apos;ve reached the maximum of {MAX_CATEGORIES} categories. Delete an existing category to create a new one.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setNewCategoryInput("");
                      setNewCategoryColorIndex(0);
                    }}
                  >
                    Back
                  </Button>
                </div>
              ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    maxLength={30}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryInput.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setNewCategoryInput("");
                      setNewCategoryColorIndex(0);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Color:</span>
                  {COLOR_PALETTE.map((color, idx) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewCategoryColorIndex(idx)}
                      className={cn(
                        "h-5 w-5 rounded-full transition-all",
                        color.dot,
                        newCategoryColorIndex === idx
                          ? "ring-2 ring-offset-1 ring-offset-background ring-foreground scale-110"
                          : "opacity-60 hover:opacity-100"
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              )
            ) : (
              <Select value={newCategory} onValueChange={(val) => {
                if (val === "__create_new__") {
                  if (categories.length < MAX_CATEGORIES) {
                    setIsCreatingCategory(true);
                  }
                } else {
                  setNewCategory(val);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const color = COLOR_PALETTE[cat.colorIndex % COLOR_PALETTE.length];
                    return (
                      <SelectItem key={cat.id} value={cat.name}>
                        <span className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", color.dot)} />
                          {cat.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                  {categories.length < MAX_CATEGORIES ? (
                    <SelectItem value="__create_new__">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Plus className="h-3.5 w-3.5" /> New Category
                      </span>
                    </SelectItem>
                  ) : (
                    <SelectItem value="__create_new__" disabled>
                      <span className="text-xs text-muted-foreground">
                        Max {MAX_CATEGORIES} categories reached
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            {categories.length > 0 && !isCreatingCategory && (
              <div className="space-y-1.5 mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const color = COLOR_PALETTE[cat.colorIndex % COLOR_PALETTE.length];
                    return (
                      <span
                        key={cat.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium group",
                          color.bg,
                          color.text
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", color.dot)} />
                        {cat.name}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`Remove ${cat.name}`}
                        >
                          <X className="h-3 w-3 hover:text-destructive" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">{categories.length}/{MAX_CATEGORIES} categories used</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Date Acquired</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDateAcquired && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDateAcquired
                    ? format(newDateAcquired, "MMM d, yyyy")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDateAcquired}
                  onSelect={(date) => date && setNewDateAcquired(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-price">Purchase Price</Label>
            <Input
              id="asset-price"
              type="number"
              step="0.01"
              min="0"
              max="1000000000"
              prefix="$"
              placeholder="0.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-market-value">
              Current Market Value{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="asset-market-value"
              type="number"
              step="0.01"
              min="0"
              max="1000000000"
              prefix="$"
              placeholder="0.00"
              value={newMarketValue}
              onChange={(e) => setNewMarketValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!newName.trim() || !newCategory || !newPrice || isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
