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
import { cn } from "@/lib/utils";
import { type Asset } from "./types";

interface SellAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onSubmit: (assetId: number, salePrice: number, dateSold: string, wallet: string) => Promise<void>;
}

export function SellAssetDialog({ open, onOpenChange, asset, onSubmit }: SellAssetDialogProps) {
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [destinationWallet, setDestinationWallet] = useState("");

  useEffect(() => {
    if (open) {
      setSalePrice("");
      setSaleDate(new Date());
      setDestinationWallet("");
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!asset || !destinationWallet || !salePrice) return;
    try {
      await onSubmit(asset.id, parseFloat(salePrice), saleDate.toISOString(), destinationWallet);
    } catch (error) {
      console.error("Error selling asset:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle>Sell {asset?.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Complete the sale details below</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Purchased for </span>
            <span className="font-medium">
              ${asset?.purchase_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale-price">Sale Price</Label>
            <Input
              id="sale-price"
              type="number"
              step="0.01"
              min="0"
              prefix="$"
              placeholder="0.00"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Date Sold</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !saleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {saleDate ? format(saleDate, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={saleDate}
                  onSelect={(date) => date && setSaleDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Deposit Into</Label>
            <Select value={destinationWallet} onValueChange={setDestinationWallet} required>
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

          {salePrice && asset && (() => {
            const net = parseFloat(salePrice) - asset.purchase_price;
            const isProfit = net >= 0;
            return (
              <div className={cn(
                "rounded-md border p-3 text-sm space-y-1",
                isProfit
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
              )}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {isProfit
                      ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      : <TrendingDown className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                    }
                    {isProfit ? "Net Profit" : "Net Loss"}
                  </span>
                  <span className={cn(
                    "font-semibold",
                    isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  )}>
                    {isProfit ? "+" : ""}${net.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
              disabled={!destinationWallet || !salePrice}
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Confirm Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
