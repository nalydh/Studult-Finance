"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Banknote, TrendingUp, CreditCard, Package,
  ArrowLeft, ArrowRight, Lock, CheckCircle2, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

/* ── Types ── */
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

/* ── Step metadata ── */
const STEPS = [
  {
    key: "cash",
    title: "Let's count your Cash",
    description: "Update the balances of your everyday and savings accounts.",
    icon: <Banknote className="h-6 w-6" />,
    color: "text-emerald-600 dark:text-emerald-400",
    emptyTitle: "No cash accounts found",
    emptyMessage: "You haven't added any cash accounts yet. You can add them in the Account Ledger.",
  },
  {
    key: "investment",
    title: "How are the markets doing?",
    description: "Check in on your stocks, super, crypto, and other investments.",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-blue-600 dark:text-blue-400",
    emptyTitle: "No investment accounts found",
    emptyMessage: "You don't have any investment accounts tracked yet.",
  },
  {
    key: "liability",
    title: "Time to face the Debt",
    description: "Update your outstanding balances on loans, credit cards, and HECS.",
    icon: <CreditCard className="h-6 w-6" />,
    color: "text-red-600 dark:text-red-400",
    emptyTitle: "No liabilities found",
    emptyMessage: "You're debt-free! Nothing to update here. 🎉",
  },
  {
    key: "assets",
    title: "Any new appraisals?",
    description: "Review the current market value of your physical assets and collectibles.",
    icon: <Package className="h-6 w-6" />,
    color: "text-amber-600 dark:text-amber-400",
    emptyTitle: "No physical assets found",
    emptyMessage: "You haven't logged any physical assets yet.",
  },
] as const;

/* ══════════════════════════════════════════════════════════════════ */

export default function CheckInPage() {
  const router = useRouter();

  /* ── Data ── */
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isAlreadyCheckedIn, setIsAlreadyCheckedIn] = useState(false);

  /* ── Draft states ── */
  const [accountBalances, setAccountBalances] = useState<Record<number, string>>({});
  const [assetPrices, setAssetPrices] = useState<Record<number, string>>({});

  /* ── Originals for diffing ── */
  const [origAccountBalances, setOrigAccountBalances] = useState<Record<number, number>>({});
  const [origAssetPrices, setOrigAssetPrices] = useState<Record<number, number>>({});

  /* ── Step ── */
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // ─── Fetch on mount ───────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE}/accounts/`).then((r) => r.json()),
      fetch(`${API_BASE}/assets/`).then((r) => r.json()),
      fetch(`${API_BASE}/snapshots/`).then((r) => r.json()),
    ])
      .then(([accs, asts, snaps]) => {
        // Check if user already has a snapshot this month
        if (Array.isArray(snaps) && snaps.length > 0) {
          const sorted = [...snaps].sort(
            (a: { snapshot_date: string }, b: { snapshot_date: string }) =>
              new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
          );
          const latest = new Date(sorted[0].snapshot_date);
          const now = new Date();
          if (latest.getMonth() === now.getMonth() && latest.getFullYear() === now.getFullYear()) {
            setIsAlreadyCheckedIn(true);
          }
        }
        const accountList: Account[] = Array.isArray(accs) ? accs : [];
        const activeAssets: Asset[] = (Array.isArray(asts) ? asts : []).filter(
          (a: Asset) => !a.is_sold
        );

        setAccounts(accountList);
        setAssets(activeAssets);

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
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // ─── Submit ───────────────────────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const accountUpdates = Object.entries(accountBalances)
        .filter(([id, val]) => (parseFloat(val) || 0) !== origAccountBalances[Number(id)])
        .map(([id, val]) =>
          fetch(`${API_BASE}/accounts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balance: parseFloat(val) || 0 }),
          })
        );

      const assetUpdates = Object.entries(assetPrices)
        .filter(([id, val]) => (parseFloat(val) || 0) !== origAssetPrices[Number(id)])
        .map(([id, val]) =>
          fetch(`${API_BASE}/assets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ market_value: parseFloat(val) || 0 }),
          })
        );

      await Promise.all([...accountUpdates, ...assetUpdates]);

      const snapshotRes = await fetch(`${API_BASE}/snapshots/`, { method: "POST" });
      if (!snapshotRes.ok) throw new Error("Failed to generate snapshot");

      setIsDone(true);
    } catch (error) {
      console.error("Error saving snapshot:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Grouped data ─────────────────────────────────────────────────
  const cashAccounts = accounts.filter((a) => a.category === "Cash");
  const investmentAccounts = accounts.filter((a) => a.category === "Investment");
  const liabilityAccounts = accounts.filter((a) => a.category === "Liability");

  function getStepItems() {
    switch (step) {
      case 1: return { type: "account" as const, items: cashAccounts };
      case 2: return { type: "account" as const, items: investmentAccounts };
      case 3: return { type: "account" as const, items: liabilityAccounts };
      case 4: return { type: "asset" as const, items: assets };
      default: return { type: "account" as const, items: [] };
    }
  }

  const currentStep = STEPS[step - 1];
  const { type, items } = getStepItems();
  const progressPercent = (step / totalSteps) * 100;

  // ─── Render ───────────────────────────────────────────────────────

  const currentMonthName = new Date().toLocaleString("en-US", { month: "long" });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading your financial data…</p>
      </div>
    );
  }

  if (isAlreadyCheckedIn) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-5">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">You&apos;re all caught up for {currentMonthName}!</h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              You&apos;ve already locked in your net worth snapshot for this month.
              Your next check-in will be available on the 1st of next month.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="mt-10">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Snapshot Locked! 🔒</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your ledgers have been updated and this month&apos;s net worth snapshot has been saved.
          You can view your progress on the dashboard.
        </p>
        <Button size="lg" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* ── Progress bar ── */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {step} of {totalSteps}</span>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Exit
          </button>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Step header ── */}
      <div className="mb-8 space-y-2">
        <div className={cn("flex items-center gap-2", currentStep.color)}>
          {currentStep.icon}
          <h1 className="text-2xl font-bold">{currentStep.title}</h1>
        </div>
        <p className="text-muted-foreground">{currentStep.description}</p>
      </div>

      {/* ── Step content ── */}
      <Card>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto opacity-40" />
              <p className="font-medium">{currentStep.emptyTitle}</p>
              <p className="text-sm">{currentStep.emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {type === "account"
                ? (items as Account[]).map((account) => (
                    <div key={account.id} className="flex items-center gap-4">
                      <Label className="text-sm flex-1 min-w-0 truncate">{account.name}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        prefix="$"
                        placeholder="0.00"
                        className="w-40 text-right"
                        value={accountBalances[account.id] ?? ""}
                        onChange={(e) =>
                          setAccountBalances((prev) => ({ ...prev, [account.id]: e.target.value }))
                        }
                      />
                    </div>
                  ))
                : (items as Asset[]).map((asset) => (
                    <div key={asset.id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm truncate block">{asset.name}</Label>
                        <p className="text-xs text-muted-foreground">
                          Purchased for ${asset.purchase_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        prefix="$"
                        placeholder="0.00"
                        className="w-40 text-right"
                        value={assetPrices[asset.id] ?? ""}
                        onChange={(e) =>
                          setAssetPrices((prev) => ({ ...prev, [asset.id]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < totalSteps ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating Ledgers & Saving…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Save & Lock Snapshot
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
