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
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { cn, money } from "@/lib/utils";
import { getCategoryColor, type CategoryItem, type Asset } from "./types";

interface BulkSellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  categories: CategoryItem[];
  onSubmit: (sales: { id: number; salePrice: number; dateSold: string }[], wallet: string) => Promise<void>;
}

export function BulkSellDialog({ open, onOpenChange, assets, categories, onSubmit }: BulkSellDialogProps) {
  const [bulkSalePrices, setBulkSalePrices] = useState<Record<number, string>>({});
  const [bulkSaleDates, setBulkSaleDates] = useState<Record<number, Date>>({});
  const [bulkDestinationWallet, setBulkDestinationWallet] = useState("");

  useEffect(() => {
    if (open) {
      const prices: Record<number, string> = {};
      const dates: Record<number, Date> = {};
      assets.forEach((a) => { prices[a.id] = ""; dates[a.id] = new Date(); });
      setBulkSalePrices(prices);
      setBulkSaleDates(dates);
      setBulkDestinationWallet("");
    }
  }, [open, assets]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bulkDestinationWallet) return;
    try {
      const sales = assets.map((a) => ({
        id: a.id,
        salePrice: parseFloat(bulkSalePrices[a.id] || "0"),
        dateSold: (bulkSaleDates[a.id] || new Date()).toISOString(),
      }));
      await onSubmit(sales, bulkDestinationWallet);
    } catch (error) {
      console.error("Error bulk selling:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle>Sell {assets.length} Asset{assets.length !== 1 && "s"}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Set sale details for each asset below</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {assets.map((asset) => {
              const color = getCategoryColor(categories, asset.category);
              return (
                <div key={asset.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{asset.name}</span>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ml-2",
                        color.bg, color.text
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", color.dot)} />
                        {asset.category}
                      </span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground space-y-0.5">
                      <div>Paid ${money(asset.purchase_price)}</div>
                      {asset.market_value != null && (
                        <div>Market ${money(asset.market_value)}</div>
                      )}
                    </div>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    prefix="$"
                    placeholder="Sale price"
                    value={bulkSalePrices[asset.id] || ""}
                    onChange={(e) =>
                      setBulkSalePrices((prev) => ({ ...prev, [asset.id]: e.target.value }))
                    }
                    required
                  />
                  {bulkSalePrices[asset.id] && (() => {
                    const sale = parseFloat(bulkSalePrices[asset.id]);
                    const pl = sale - asset.purchase_price;
                    const isProfit = pl >= 0;
                    return (
                      <div className="flex items-center gap-1.5 text-xs">
                        {isProfit
                          ? <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          : <TrendingDown className="h-3 w-3 text-red-500 dark:text-red-400" />
                        }
                        <span className={cn(
                          "font-medium",
                          isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                        )}>
                          {isProfit ? "+" : ""}${money(pl)} {isProfit ? "Profit" : "Loss"}
                        </span>
                      </div>
                    );
                  })()}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1.5"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bulkSaleDates[asset.id]
                          ? format(bulkSaleDates[asset.id], "MMM d, yyyy")
                          : "Date sold"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={bulkSaleDates[asset.id]}
                        onSelect={(date) =>
                          date && setBulkSaleDates((prev) => ({ ...prev, [asset.id]: date }))
                        }
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label>Deposit All Into</Label>
            <Select value={bulkDestinationWallet} onValueChange={setBulkDestinationWallet} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a wallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Needs">Needs</SelectItem>
                <SelectItem value="Wants">Wants</SelectItem>
                <SelectItem value="Savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {Object.values(bulkSalePrices).some((p) => p) && (() => {
            const totalSale = Object.values(bulkSalePrices).reduce((s, p) => s + (parseFloat(p) || 0), 0);
            const totalCost = assets.reduce((s, a) => s + a.purchase_price, 0);
            const totalPL = totalSale - totalCost;
            const isProfit = totalPL >= 0;
            return (
              <div className={cn(
                "rounded-md border p-3 text-sm space-y-2",
                isProfit
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
              )}>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sale Value</span>
                  <span className="font-medium">
                    ${money(totalSale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {isProfit
                      ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      : <TrendingDown className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                    }
                    {isProfit ? "Total Profit" : "Total Loss"}
                  </span>
                  <span className={cn(
                    "font-semibold",
                    isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  )}>
                    {isProfit ? "+" : ""}${money(totalPL)}
                  </span>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!bulkDestinationWallet || Object.values(bulkSalePrices).some((p) => !p)}
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Confirm {assets.length} Sale{assets.length !== 1 && "s"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
