"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
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
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { COLOR_PALETTE, type CategoryItem, type Asset } from "./types";

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  categories: CategoryItem[];
  onSubmit: (id: number, data: { name: string; category: string; purchase_price: number; market_value: number | null; date_acquired: string }) => Promise<void>;
}

export function EditAssetDialog({ open, onOpenChange, asset, categories, onSubmit }: EditAssetDialogProps) {
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMarketValue, setEditMarketValue] = useState("");
  const [editDateAcquired, setEditDateAcquired] = useState<Date>(new Date());

  useEffect(() => {
    if (open && asset) {
      setEditName(asset.name);
      setEditCategory(asset.category);
      setEditPrice(asset.purchase_price.toString());
      setEditMarketValue(asset.market_value != null ? asset.market_value.toString() : "");
      setEditDateAcquired(new Date(asset.date_acquired));
    }
  }, [open, asset]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!asset || !editName.trim() || !editCategory || !editPrice || !editDateAcquired) return;
    try {
      await onSubmit(asset.id, {
        name: editName,
        category: editCategory,
        purchase_price: parseFloat(editPrice),
        market_value: editMarketValue ? parseFloat(editMarketValue) : null,
        date_acquired: editDateAcquired.toISOString(),
      });
    } catch (error) {
      console.error("Error updating asset:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {asset?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              placeholder="e.g. MacBook Pro"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter((cat) => cat.name).map((cat) => {
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
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Acquired</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !editDateAcquired && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editDateAcquired
                    ? format(editDateAcquired, "MMM d, yyyy")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editDateAcquired}
                  onSelect={(date) => date && setEditDateAcquired(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-price">Purchase Price</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              min="0"
              prefix="$"
              placeholder="0.00"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              required
            />
          </div>
          {(() => {
            const currentVal = parseFloat(editMarketValue) || 0;
            const purchaseVal = parseFloat(editPrice) || 0;
            const diff = currentVal - purchaseVal;
            const isUp = diff >= 0;
            const hasMarketValue = editMarketValue !== "";
            return (
              <div className={cn(
                "rounded-lg border-2 p-4 space-y-2",
                !hasMarketValue
                  ? "border-muted bg-muted/30"
                  : isUp
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                    : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
              )}>
                <Label htmlFor="edit-market-value" className="flex items-center gap-1.5 text-sm font-semibold">
                  {hasMarketValue
                    ? (isUp
                      ? <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      : <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />)
                    : null
                  }
                  Current Market Value
                  <span className="text-muted-foreground text-xs font-medium">(Optional)</span>
                </Label>
                <Input
                  id="edit-market-value"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="$"
                  placeholder="0.00"
                  value={editMarketValue}
                  onChange={(e) => setEditMarketValue(e.target.value)}
                  className="border-0 bg-white dark:bg-zinc-900 shadow-sm"
                />
                {hasMarketValue && editPrice && (
                  <p className={cn(
                    "text-xs font-medium",
                    isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  )}>
                    {isUp ? "+" : ""}
                    ${diff.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    {" "}({purchaseVal > 0 ? (isUp ? "+" : "") + ((diff / purchaseVal) * 100).toFixed(1) : "0"}%) from purchase
                  </p>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!editName.trim() || !editCategory || !editPrice}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
