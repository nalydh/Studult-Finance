"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import BudgetForm from "./components/budgetsplitter/components/BudgetForm";
import AssetLedger from "./components/assetledger/AssetLedger";
import AccountLedger from "./components/accountledger/AccountLedger";
import { CheckInBanner } from "./components/CheckInBanner";
import { NetWorthCard } from "./components/NetWorthCard";
import Link from "next/link";
import { ArrowRight, Loader2, HelpCircle } from "lucide-react";
import DashboardTour from "@/components/DashboardTour";

/* ── Animated card wrapper ── */
function FadeCard({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-6 duration-700 ease-out fill-mode-both ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function DashboardContent({ onReset }: { onReset: () => void }) {
  const { data: session, status } = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? null;

  const router = useRouter();
  const authFetch = useAuthFetch();

  const [isCheckingPrefs, setIsCheckingPrefs] = useState(true);
  const [showTour, setShowTour] = useState(false);

  // Gate: wait for all 4 cards to finish their initial fetch before revealing the dashboard
  const CARDS_TOTAL = 4;
  const [readyCount, setReadyCount] = useState(0);
  const handleCardReady = useCallback(() => {
    setReadyCount((n) => n + 1);
  }, []);
  const allCardsReady = readyCount >= CARDS_TOTAL;

  useEffect(() => {
    if (status === "authenticated") {
      authFetch("/budget/preferences")
        .then((res) => res.json())
        .then((data) => {
          if (data.error === "No preferences found") {
            router.push("/welcome");
          } else {
            if (data.tutorial_completed === false) {
              setShowTour(true);
            }
            setIsCheckingPrefs(false);
          }
        })
        .catch((err) => {
          console.error(err);
          setIsCheckingPrefs(false);
        });
    } else if (status === "unauthenticated") {
      router.push("/login"); // or handle redirect
    }
  }, [status, authFetch, router]);

  // Only block on auth/prefs check — cards render invisibly while fetching
  if (status === "loading" || isCheckingPrefs) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <>
      {/* Spinner overlay shown until all cards are ready */}
      {!allCardsReady && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      )}
      <div className={`max-w-7xl mx-auto px-4 py-6 ${!allCardsReady ? "invisible" : ""}`}>
      {/* Header */}
      {showTour && (
        <DashboardTour
          run={showTour}
          onFinish={() => { setShowTour(false); onReset(); }}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {userName ? `Welcome back, ${userName[0].toUpperCase() + userName.slice(1)}!` : "Dashboard"}
          </h1>
          {userName && (
            <p className="text-sm text-muted-foreground mt-0.5">Here’s your financial overview.</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTour(true)}
            title="Start guided tour"
            className="group flex items-center justify-center w-9 h-9 rounded-full border-2 border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all duration-200 shadow-sm hover:shadow-emerald-200 hover:shadow-md"
          >
            <HelpCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          </button>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors duration-200 group"
          >
            View Analytics
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      <FadeCard delay={0}>
        <CheckInBanner />
      </FadeCard>

      {/* Canvas Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left column: Budget Splitter */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <FadeCard delay={80}>
            <BudgetForm onReady={handleCardReady} />
          </FadeCard>
        </div>

        {/* Right column: Net Worth Card → Accounts → Assets */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          <FadeCard delay={160}>
            <NetWorthCard onReady={handleCardReady} />
          </FadeCard>
          <div id="tour-account-ledger" style={{ scrollMarginTop: '80px' }}>
            <FadeCard delay={240}>
              <AccountLedger onReady={handleCardReady} />
            </FadeCard>
          </div>
          <div id="tour-asset-ledger" style={{ scrollMarginTop: '80px' }}>
            <FadeCard delay={320}>
              <AssetLedger onReady={handleCardReady} />
            </FadeCard>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [pageKey, setPageKey] = useState(0);
  return <DashboardContent key={pageKey} onReset={() => setPageKey((k) => k + 1)} />;
}
