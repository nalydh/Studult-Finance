"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Banknote, TrendingUp, CreditCard, Package } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Account {
  id: number;
  name: string;
  category: string;
  balance: number;
}

interface Asset {
  id: number;
  name: string;
  category: string;
  purchase_price: number;
  market_value: number | null;
  is_sold: boolean;
}

interface MonthlyAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MonthlyAuditModal({ open, onOpenChange, onSuccess }: MonthlyAuditModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Draft states keyed by id → string value for controlled inputs
  const [accountBalances, setAccountBalances] = useState<Record<number, string>>({});
  const [assetPrices, setAssetPrices] = useState<Record<number, string>>({});

  // Original values for diffing on submit
  const [origAccountBalances, setOrigAccountBalances] = useState<Record<number, number>>({});
  const [origAssetPrices, setOrigAssetPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!open) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [accsRes, astsRes] = await Promise.all([
          fetch(`${API_BASE}/accounts/`),
          fetch(`${API_BASE}/assets/`),
        ]);
        const accs = await accsRes.json();
        const asts = await astsRes.json();

        const accountList: Account[] = Array.isArray(accs) ? accs : [];
        const activeAssets: Asset[] = (Array.isArray(asts) ? asts : []).filter(
          (a: Asset) => !a.is_sold
        );

        setAccounts(accountList);
        setAssets(activeAssets);

        // Initialize drafts
        const ab: Record<number, string> = {};
        const origAb: Record<number, number> = {};
        accountList.forEach((a) => {
          ab[a.id] = a.balance.toString();
          origAb[a.id] = a.balance;
        });
        setAccountBalances(ab);
        setOrigAccountBalances(origAb);

        const ap: Record<number, string> = {};
        const origAp: Record<number, number> = {};
        activeAssets.forEach((a) => {
          const val = a.market_value ?? a.purchase_price;
          ap[a.id] = val.toString();
          origAp[a.id] = val;
        });
        setAssetPrices(ap);
        setOrigAssetPrices(origAp);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [open]);

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Build update promises for changed accounts
      const accountUpdates = Object.entries(accountBalances)
        .filter(([id, val]) => {
          const newVal = parseFloat(val) || 0;
          return newVal !== origAccountBalances[Number(id)];
        })
        .map(([id, val]) =>
          fetch(`${API_BASE}/accounts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balance: parseFloat(val) || 0 }),
          })
        );

      // 2. Build update promises for changed assets
      const assetUpdates = Object.entries(assetPrices)
        .filter(([id, val]) => {
          const newVal = parseFloat(val) || 0;
          return newVal !== origAssetPrices[Number(id)];
        })
        .map(([id, val]) =>
          fetch(`${API_BASE}/assets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ market_value: parseFloat(val) || 0 }),
          })
        );

      // 3. Update all ledgers first
      await Promise.all([...accountUpdates, ...assetUpdates]);

      // 4. Generate the frozen snapshot
      const snapshotRes = await fetch(`${API_BASE}/snapshots/`, { method: "POST" });
      if (!snapshotRes.ok) throw new Error("Failed to generate snapshot");

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving snapshot:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const cashAccounts = accounts.filter((a) => a.category === "Cash");
  const investmentAccounts = accounts.filter((a) => a.category === "Investment");
  const liabilityAccounts = accounts.filter((a) => a.category === "Liability");

  function renderAccountRow(account: Account) {
    return (
      <div key={account.id} className="flex items-center gap-3">
        <Label className="text-sm flex-1 min-w-0 truncate">{account.name}</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          prefix="$"
          placeholder="0.00"
          className="w-36 text-right"
          value={accountBalances[account.id] ?? ""}
          onChange={(e) =>
            setAccountBalances((prev) => ({ ...prev, [account.id]: e.target.value }))
          }
        />
      </div>
    );
  }

  function renderAssetRow(asset: Asset) {
    return (
      <div key={asset.id} className="flex items-center gap-3">
        <Label className="text-sm flex-1 min-w-0 truncate">{asset.name}</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          prefix="$"
          placeholder="0.00"
          className="w-36 text-right"
          value={assetPrices[asset.id] ?? ""}
          onChange={(e) =>
            setAssetPrices((prev) => ({ ...prev, [asset.id]: e.target.value }))
          }
        />
      </div>
    );
  }

  const isEmpty = accounts.length === 0 && assets.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Monthly Net Worth Check-In</DialogTitle>
          <DialogDescription>
            Review and update your balances below, then lock in this month&apos;s snapshot.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading your ledgers…
          </div>
        ) : isEmpty ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="font-medium">No accounts or assets found</p>
            <p className="text-sm mt-1">Add some accounts and assets first, then come back.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2 py-2">
              {/* ── Cash Accounts ── */}
              {cashAccounts.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Banknote className="h-4 w-4" /> Cash Accounts
                  </h3>
                  <div className="space-y-2">{cashAccounts.map(renderAccountRow)}</div>
                </section>
              )}

              {/* ── Investment Accounts ── */}
              {investmentAccounts.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="h-4 w-4" /> Investment Accounts
                  </h3>
                  <div className="space-y-2">{investmentAccounts.map(renderAccountRow)}</div>
                </section>
              )}

              {/* ── Liabilities ── */}
              {liabilityAccounts.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <CreditCard className="h-4 w-4" /> Liabilities
                  </h3>
                  <div className="space-y-2">{liabilityAccounts.map(renderAccountRow)}</div>
                </section>
              )}

              {/* ── Physical Assets ── */}
              {assets.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Package className="h-4 w-4" /> Physical Assets
                  </h3>
                  <div className="space-y-2">{assets.map(renderAssetRow)}</div>
                </section>
              )}
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? "Updating Ledgers & Saving…" : "Save & Lock Snapshot"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}