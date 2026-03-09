"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Trash2Icon, X, Pencil } from "lucide-react";
import { BudgetItem } from "./BudgetForm";

interface BreakdownSheetProps {
  category: "Needs" | "Wants" | "Savings";
  totalAllocated: number; // The big number from your 50/30/20 split
  items: BudgetItem[]; // List of expenses
  children: React.ReactNode; // The Card component goes here
  onItemAdded?: () => void; // Callback after item is added
  onItemDeleted?: (itemId: string | number) => void; // Callback to delete item
}

export function BreakdownSheet({
  category,
  items,
  children,
  onItemAdded,
  onItemDeleted,
}: BreakdownSheetProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemAmount, setEditItemAmount] = useState("");

  const handleAddItem = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/budget/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newItemName,
            amount: parseFloat(newItemAmount),
            category: category,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to add budget item");
        }
        
        // Notify parent to refresh items
        if (onItemAdded) {
          onItemAdded();
        }
      
    } finally {
      setNewItemName("");
      setNewItemAmount("");
      setIsAdding(false);
    }
  };

  const handleStartEdit = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemAmount(item.amount.toString());
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemName("");
    setEditItemAmount("");
  };

  const handleSaveEdit = async (itemId: string | number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/budget/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editItemName,
          amount: parseFloat(editItemAmount),
        }),
      });
      if (!response.ok) throw new Error("Failed to update budget item");
      handleCancelEdit();
      if (onItemAdded) onItemAdded();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string | number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/budget/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete budget item");
      }

      if (onItemDeleted) {
        onItemDeleted(itemId);
      }

    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleCancel = () => {
    setNewItemName("");
    setNewItemAmount("");
    setIsAdding(false);
  };

  const resetAllState = () => {
    handleCancel();
    handleCancelEdit();
  };

  return (
    <Sheet onOpenChange={(open) => { if (!open) resetAllState(); }}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6 space-y-1">
          <SheetTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            {category} Breakdown
          </SheetTitle>
        </SheetHeader>

        {/* THE ITEM LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Items</h3>
            <span className="text-xs text-gray-500">{items.length > 1 ? `${items.length} items` : `${items.length} item`}</span>
          </div>

          {items.length === 0 && !isAdding ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-400">
              <p>No items added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isEditing = editingItemId === item.id;

                if (isEditing) {
                  return (
                    <div key={item.id} className="p-4 border-2 border-primary/30 rounded-lg bg-gray-50 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">
                          Edit {category} Item
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-name-${item.id}`} className="text-sm">
                          Item Name
                        </Label>
                        <Input
                          id={`edit-name-${item.id}`}
                          type="text"
                          value={editItemName}
                          onChange={(e) => setEditItemName(e.target.value)}
                          className="focus-visible:ring-primary-light"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-amount-${item.id}`} className="text-sm">
                          Amount
                        </Label>
                        <Input
                          id={`edit-amount-${item.id}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          prefix="$"
                          value={editItemAmount}
                          onChange={(e) => setEditItemAmount(e.target.value)}
                          pattern="[0-9]*\.?[0-9]*"
                          className="focus-visible:ring-primary-light"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleSaveEdit(item.id)}
                          className="flex-1 bg-primary-dark hover:bg-primary-light"
                          disabled={!editItemName || !editItemAmount}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between p-3 border rounded-md shadow-sm bg-white hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-700">
                        ${item.amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleStartEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* ADD NEW ITEM FORM */}
              {isAdding && (
                <div className="p-4 border-2 border-primary/30 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">
                      New {category} Item
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCancel}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-name" className="text-sm">
                      Item Name
                    </Label>
                    <Input
                      id="item-name"
                      type="text"
                      placeholder={
                        category === "Needs"
                          ? "Rent, Bills"
                          : category === "Wants"
                          ? "Dining, Entertainment"
                          : "Investments, Emergency Fund"
                      }
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="focus-visible:ring-primary-light"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-amount" className="text-sm">
                      Amount
                    </Label>
                    <Input
                      id="item-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      prefix="$"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                      pattern="[0-9]*\.?[0-9]*"
                      className="focus-visible:ring-primary-light"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAddItem}
                      className="flex-1 bg-primary-dark hover:bg-primary-light"
                      disabled={!newItemName || !newItemAmount}
                    >
                      Add Item
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADD BUTTON */}
          {!isAdding && (
            <Button
              variant="outline"
              className="w-full mt-4 py-6 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => setIsAdding(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add New {category} Item
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
