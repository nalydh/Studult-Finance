"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarClock, ArrowRight } from "lucide-react";
import { API_BASE } from "@/lib/api";

export function CheckInBanner() {
  const [shouldShow, setShouldShow] = useState(false);
  const [daysSince, setDaysSince] = useState<number | null>(null);

  useEffect(() => {
    async function checkSnapshots() {
      try {
        const res = await fetch(`${API_BASE}/snapshots/`);
        const snapshots = await res.json();

        if (!Array.isArray(snapshots) || snapshots.length === 0) {
          setShouldShow(true);
          return;
        }

        const latest = snapshots[snapshots.length - 1];
        const latestDate = new Date(latest.snapshot_date);
        const now = new Date();
        const diffMs = now.getTime() - latestDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        setDaysSince(diffDays);
        if (diffDays >= 30) {
          setShouldShow(true);
        }
      } catch (err) {
        console.error("Error checking snapshots:", err);
      }
    }

    checkSnapshots();
  }, []);

  if (!shouldShow) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Time for your Monthly Check-In!
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {daysSince !== null
              ? `It's been ${daysSince} days since your last snapshot. Update your balances to see your new net worth.`
              : "You haven't recorded a snapshot yet. Complete your first check-in to start tracking your net worth."}
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
        <Link href="/check-in">
          Check In
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </div>
  );
}
