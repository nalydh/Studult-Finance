"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Banknote, TrendingUp, CreditCard, Package,
  ArrowLeft, ArrowRight, Lock, CheckCircle2, PartyPopper, Info, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { useAuthFetch } from "@/hooks/useAuthFetch";

/* ── Types ── */
interface Account {
  id: number;
  name: string;
  category: string;
  balance: number;
  total_contributions: number;
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
    description: "Update your investment balances and log any contributions you made this month.",
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

/* ── Per-step tip content ── */
const STEP_TIPS: Record<number, { heading: string; points: string[] }> = {
  1: {
    heading: "How to prepare your cash balances",
    points: [
      "Open your banking app and check the current balance of every everyday, savings, and offset account you hold.",
      "Don't forget to count the physical cash you have in your wallet — it counts!",
      "StuFin never connects to your bank. You are manually entering these balances, so make sure they're fresh.",
      "Complete this check-in after you have already set up your accounts in the Account Ledger on the Dashboard.",
    ],
  },
  2: {
    heading: "How to check your investment balances",
    points: [
      "Log into your broker or superannuation app.",
      "Enter the current portfolio value as the balance, not the amount you contributed.",
      "In the 'Contributed this month' column, enter any new money you deposited into the account this month. Leave blank if nothing new was added.",
      "This data powers the Contributions vs. Growth chart in Analytics — the more consistently you check in, the better it looks.",
    ],
  },
  3: {
    heading: "How to check your liabilities",
    points: [
      "Save a bookmark or link to each of your debt portals so you can open them quickly each month.",
      "For student debt, check the associated portal.",
      "For credit cards, use the statement balance — not the current balance, as pending transactions may not be settled.",
      "For mortgages or personal loans, log into your lender's app or internet banking.",
      "Enter the outstanding amount you still owe, not the original loan amount.",
    ],
  },
  4: {
    heading: "How to check your physical asset values",
    points: [
      "For collectibles (trading cards, sneakers, comics), apps like Collectr and eBay sold listings can give you current market values.",
      "For property, check recent comparable sales on your country's main real-estate app for a rough estimate.",
      "For vehicles, use your country's main car-sales app for a rough estimate.",
      "For tech (MacBooks, cameras etc.), check current second-hand prices on eBay or Facebook Marketplace.",
      "If no app tracks it, a quick Google of recent sold prices is fine — accuracy and consistency is the goal.",
      "Leave the value unchanged if nothing has materially changed since your last check-in.",
    ],
  },
};

/* ── Collapsible tip component ── */
function CheckInTip({ step }: { step: number }) {
  const [open, setOpen] = useState(false);
  const tip = STEP_TIPS[step];
  if (!tip) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Toggle row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800">
            Not sure where to start? Read this first.
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-amber-500 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable body */}
      {open && (
        <div className="px-4 pb-4 border-t border-amber-200">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-3 mb-2">
            {tip.heading}
          </p>
          <ul className="space-y-2">
            {tip.points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-amber-900">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */

export default function CheckInPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? null;

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
  // New: monthly contribution per investment account (optional, defaults to "0")
  const [investmentContributions, setInvestmentContributions] = useState<Record<number, string>>({});

  /* ── Originals for diffing ── */
  const [origAccountBalances, setOrigAccountBalances] = useState<Record<number, number>>({});
  const [origAssetPrices, setOrigAssetPrices] = useState<Record<number, number>>({});

  /* ── Step ── */
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const authFetch = useAuthFetch();

  // ─── Fetch on mount ───────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      authFetch("/accounts/").then((r) => r.json()),
      authFetch("/assets/").then((r) => r.json()),
      authFetch("/snapshots/").then((r) => r.json()),
    ])
      .then(([accs, asts, snaps]) => {
        if (Array.isArray(snaps) && snaps.length > 0) {
          const sorted = [...snaps].sort(
            (a: { snapshot_date: string }, b: { snapshot_date: string }) =>
              new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
          );
          const latestDate = new Date(sorted[0].snapshot_date);
          const now = new Date();
          if (latestDate.getMonth() === now.getMonth() && latestDate.getFullYear() === now.getFullYear()) {
            setIsAlreadyCheckedIn(true);
          }
        }
        const accountList: Account[] = Array.isArray(accs) ? accs : [];
        const activeAssets: Asset[] = (Array.isArray(asts) ? asts : []).filter((a: Asset) => !a.is_sold);

        setAccounts(accountList);
        setAssets(activeAssets);

        const ab: Record<number, string> = {};
        const origAb: Record<number, number> = {};
        const ic: Record<number, string> = {};
        accountList.forEach((a) => {
          ab[a.id] = a.balance.toString();
          origAb[a.id] = a.balance;
          if (a.category === "Investment") ic[a.id] = "";
        });
        setAccountBalances(ab);
        setOrigAccountBalances(origAb);
        setInvestmentContributions(ic);

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
  }, [authFetch]);

  // ─── Submit ───────────────────────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      // 1. Update account balances (only changed ones)
      const accountUpdates = Object.entries(accountBalances)
        .filter(([id, val]) => (parseFloat(val) || 0) !== origAccountBalances[Number(id)])
        .map(([id, val]) =>
          authFetch(`/accounts/${id}`, {
            method: "PUT",
            body: JSON.stringify({ balance: parseFloat(val) || 0 }),
          })
        );

      const assetUpdates = Object.entries(assetPrices)
        .filter(([id, val]) => (parseFloat(val) || 0) !== origAssetPrices[Number(id)])
        .map(([id, val]) =>
          authFetch(`/assets/${id}`, {
            method: "PUT",
            body: JSON.stringify({ market_value: parseFloat(val) || 0 }),
          })
        );

      await Promise.all([...accountUpdates, ...assetUpdates]);

      const investmentAccounts = accounts.filter((a) => a.category === "Investment");
      const contributionLogs = investmentAccounts.map((acc) => {
        const contribution = parseFloat(investmentContributions[acc.id] || "0") || 0;
        const newBalance = parseFloat(accountBalances[acc.id] || "0") || acc.balance;
        return authFetch("/investment-contributions/", {
          method: "POST",
          body: JSON.stringify({
            account_id: acc.id,
            date: today,
            amount: contribution,
            balance_at_date: newBalance,
            note: "Monthly check-in",
          }),
        });
      });
      await Promise.all(contributionLogs);

      const totalContribUpdates = investmentAccounts.map((acc) => {
        const added = parseFloat(investmentContributions[acc.id] || "0") || 0;
        if (added === 0) return Promise.resolve();
        const newTotal = (acc.total_contributions ?? 0) + added;
        return authFetch(`/accounts/${acc.id}`, {
          method: "PUT",
          body: JSON.stringify({ total_contributions: newTotal }),
        });
      });
      await Promise.all(totalContribUpdates);

      const snapshotRes = await authFetch("/snapshots/", { method: "POST" });
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
      case 1: return cashAccounts;
      case 2: return investmentAccounts;
      case 3: return liabilityAccounts;
      case 4: return assets;
      default: return [];
    }
  }

  const currentStep = STEPS[step - 1];
  const items = getStepItems();
  const progressPercent = (step / totalSteps) * 100;
  const currentMonthName = new Date().toLocaleString("en-US", { month: "long" });

  // ─── Render ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm">Loading your financial data…</p>
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
          You can view your progress on the dashboard and analytics.
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
      <div className="mb-4 space-y-2">
        <div className={cn("flex items-center gap-2", currentStep.color)}>
          {currentStep.icon}
          <h1 className="text-2xl font-bold">
            {step === 1 && userName
              ? `Let’s take a look at where you’re at, ${userName}.`
              : currentStep.title}
          </h1>
        </div>
        <p className="text-muted-foreground">{currentStep.description}</p>
      </div>

      {/* ── Collapsible tip ── */}
      <CheckInTip step={step} />

      {/* ── Step content ── */}
      <Card>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto opacity-40" />
              <p className="font-medium">{currentStep.emptyTitle}</p>
              <p className="text-sm">{currentStep.emptyMessage}</p>
            </div>
          ) : step === 2 ? (
            /* Investment step — balance + contribution */
            <div className="space-y-5">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_140px_140px] gap-3 items-center px-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Current Balance</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Contributed this month</span>
              </div>
              {(items as Account[]).map((account) => (
                <div key={account.id} className="grid grid-cols-[1fr_140px_140px] gap-3 items-center">
                  <Label className="text-sm truncate">{account.name}</Label>
                  <Input
                    type="number" step="0.01" min="0" prefix="$" placeholder="0.00"
                    className="text-right"
                    value={accountBalances[account.id] ?? ""}
                    onChange={(e) => setAccountBalances((prev) => ({ ...prev, [account.id]: e.target.value }))}
                  />
                  <Input
                    type="number" step="0.01" min="0" prefix="$" placeholder="0.00"
                    className="text-right"
                    value={investmentContributions[account.id] ?? ""}
                    onChange={(e) => setInvestmentContributions((prev) => ({ ...prev, [account.id]: e.target.value }))}
                  />
                </div>
              ))}
              {/* Hint */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700 mt-2">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <p>Leave &quot;Contributed this month&quot; as blank if you didn&apos;t top up any accounts. Your current balance is still recorded for the portfolio chart.</p>
              </div>
            </div>
          ) : step === 4 ? (
            /* Assets step */
            <div className="space-y-4">
              {(items as Asset[]).map((asset) => (
                <div key={asset.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm truncate block">{asset.name}</Label>
                    <p className="text-xs text-muted-foreground">
                      Purchased for ${asset.purchase_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Input
                    type="number" step="0.01" min="0" prefix="$" placeholder="0.00"
                    className="w-40 text-right"
                    value={assetPrices[asset.id] ?? ""}
                    onChange={(e) => setAssetPrices((prev) => ({ ...prev, [asset.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Cash / Liability steps */
            <div className="space-y-4">
              {(items as Account[]).map((account) => (
                <div key={account.id} className="flex items-center gap-4">
                  <Label className="text-sm flex-1 min-w-0 truncate">{account.name}</Label>
                  <Input
                    type="number" step="0.01" min="0" prefix="$" placeholder="0.00"
                    className="w-40 text-right"
                    value={accountBalances[account.id] ?? ""}
                    onChange={(e) => setAccountBalances((prev) => ({ ...prev, [account.id]: e.target.value }))}
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
