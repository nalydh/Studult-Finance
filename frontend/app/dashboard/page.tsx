"use client";

import React, { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import BudgetForm from "./components/budgetsplitter/components/BudgetForm";
import AssetLedger from "./components/assetledger/AssetLedger";
import AccountLedger from "./components/accountledger/AccountLedger";
import { CheckInBanner } from "./components/CheckInBanner";
import { NetWorthCard } from "./components/NetWorthCard";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

/* ── Entrance animation hook ── */
function useSlideIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-in");
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Animated card wrapper ── */
function FadeCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useSlideIn();
  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-4 transition-none [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 [&.animate-in]:transition-all [&.animate-in]:duration-500 [&.animate-in]:ease-out"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function DashboardPage() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? null;

  const router = useRouter();
  const authFetch = useAuthFetch();

  useEffect(() => {
    if (status === "authenticated") {
      authFetch("/budget/preferences")
        .then((res) => res.json())
        .then((data) => {
          if (data.error === "No preferences found") {
            router.push("/welcome");
          }
        })
        .catch(console.error);
    }
  }, [status, authFetch, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {userName ? `Welcome back, ${userName}` : "Dashboard"}
          </h1>
          {userName && (
            <p className="text-sm text-muted-foreground mt-0.5">Here’s your financial overview.</p>
          )}
        </div>
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors duration-200 group"
        >
          View Analytics
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      <FadeCard delay={0}>
        <CheckInBanner />
      </FadeCard>

      {/* Canvas Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left column: Budget Splitter */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <FadeCard delay={80}>
            <BudgetForm />
          </FadeCard>
        </div>

        {/* Right column: Net Worth Card → Accounts → Assets */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          <FadeCard delay={160}>
            <NetWorthCard />
          </FadeCard>
          <FadeCard delay={240}>
            <AccountLedger />
          </FadeCard>
          <FadeCard delay={320}>
            <AssetLedger />
          </FadeCard>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
