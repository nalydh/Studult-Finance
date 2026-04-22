"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

interface Snapshot {
  id: number;
  snapshot_date: string;
  total_cash: number;
  total_investments: number;
  total_liabilities: number;
  total_assets: number;
  net_worth: number;
}

export function NetWorthCard({ onReady }: { onReady?: () => void }) {
  const authFetch = useAuthFetch();
  const [latest, setLatest] = useState<Snapshot | null>(null);
  const [previous, setPrevious] = useState<Snapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authFetch("/snapshots/")
      .then((r) => r.json())
      .then((snapshots: Snapshot[]) => {
        if (!Array.isArray(snapshots) || snapshots.length === 0) {
          setLatest(null);
          return;
        }
        setLatest(snapshots[snapshots.length - 1]);
        if (snapshots.length >= 2) {
          setPrevious(snapshots[snapshots.length - 2]);
        }
      })
      .catch((err) => console.error("Error fetching snapshots:", err))
      .finally(() => { setIsLoading(false); onReady?.(); });
  }, [authFetch]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Loading net worth…
        </CardContent>
      </Card>
    );
  }

  if (!latest) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Net Worth</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm pb-6">
          <p>No snapshots yet.</p>
          <p className="mt-1">Complete your first monthly check-in to see your net worth here.</p>
        </CardContent>
      </Card>
    );
  }

  const change = previous ? latest.net_worth - previous.net_worth : null;
  const changePct = previous && previous.net_worth !== 0
    ? ((change! / Math.abs(previous.net_worth)) * 100)
    : null;

  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Net Worth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big number */}
        <div>
          <p className={`text-3xl font-bold tracking-tight ${latest.net_worth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            ${latest.net_worth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {change !== null && (
            <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-muted-foreground"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : isNegative ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              <span>
                {isPositive ? "+" : ""}
                ${change.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {changePct !== null && (
                <span className="text-muted-foreground">
                  ({isPositive ? "+" : ""}{changePct.toFixed(1)}%)
                </span>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
            <p className="text-muted-foreground text-xs">Cash</p>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              ${latest.total_cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
            <p className="text-muted-foreground text-xs">Investments</p>
            <p className="font-semibold text-blue-700 dark:text-blue-400">
              ${latest.total_investments.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
            <p className="text-muted-foreground text-xs">Assets</p>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              ${latest.total_assets.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2">
            <p className="text-muted-foreground text-xs">Liabilities</p>
            <p className="font-semibold text-red-700 dark:text-red-400">
              -${latest.total_liabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Last updated */}
        <p className="text-xs text-muted-foreground text-right">
          Last snapshot: {new Date(latest.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </CardContent>
    </Card>
  );
}
