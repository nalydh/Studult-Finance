"use client";

import React, { useState, useEffect } from "react";
import { money } from "@/lib/utils";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Lock, Send, TrendingUp, PiggyBank, ShoppingCart, ChevronRight, Info, ChevronLeft, Loader2, HelpCircle } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line
} from "recharts";
import { API_BASE } from "@/lib/api";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { PortfolioPanel } from "./InvestmentAnalyticsTable";
import AnalyticsTour from "@/components/AnalyticsTour";

// ── Universal colour palette — mirrors wallet icon colours ──
const C = {
  needs:    "#4ade80", // green-400
  wants:    "#2563eb", // blue-600
  savings:  "#16a34a", // green-700
  cash:     "#0ea5e9", // sky-500
  physical: "#f59e0b", // amber-500
  index:    "#10b981", // emerald-500
  netWorth: "#10b981",
};

const CHART_MARGIN  = { top: 8, right: 16, left: 0, bottom: 28 };
const TICK          = { fill: "#64748b", fontSize: 11 };
const TIP_STYLE     = { borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)", fontSize: "12px" };

const AI_PROMPTS = [
  { icon: <TrendingUp className="w-3.5 h-3.5" />, text: "How is my net worth trending?" },
  { icon: <PiggyBank className="w-3.5 h-3.5" />,  text: "Am I saving enough each month?" },
  { icon: <ShoppingCart className="w-3.5 h-3.5" />, text: "Is my savings rate improving?" },
];

interface SpendingPeriod {
  month:             string;
  income:            number;
  estimatedSpending: number;
  investmentGrowth:  number;
  netWorthChange:    number;
  savingsRate:       number | null;
}

interface AnalyticsData {
  netWorthData:         { month: string; value: number; isLive?: boolean; note?: string | null }[];
  spendingData:         SpendingPeriod[];
  assetAllocationData:  { month: string; cash: number; investments: number; physical: number; isLive?: boolean }[];
  allocationTrendsData: { label: string; saved: number; needs: number; wants: number }[];
  incomeLog:            { id: number; date: string; source: string; strategy: string; amount: number; needs: number; wants: number; savings: number }[];
}

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

/* ── Net worth tooltip — surfaces the note captured at check-in ── */
function NetWorthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const note = payload[0]?.payload?.note;
  return (
    <div className="rounded-lg bg-white shadow-lg border border-slate-200 px-3 py-2 max-w-[230px]">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-900">${money(payload[0].value)}</p>
      {note && (
        <p className="mt-1.5 pt-1.5 border-t border-slate-100 text-xs text-slate-600 leading-snug">
          “{note}”
        </p>
      )}
    </div>
  );
}

// ── Reusable Info Tooltip ──
function InfoTooltip({ title, lines }: { title: string; lines: { color: string; label: string; desc: string }[] }) {
  return (
    <div className="relative group">
      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-slate-600 transition-colors" />
      <div className="absolute right-0 top-5 z-50 hidden group-hover:block min-w-[270px] bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2.5 shadow-xl">
        <p className="font-semibold mb-1.5 text-white">{title}</p>
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-1.5 mb-0.5">
            <span className="mt-[3px] w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
            <p>
              <span className="text-white font-medium">{l.label}</span>
              <span className="text-slate-400"> — {l.desc}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InteractiveLegend({
  items,
  hidden,
  onToggle,
}: {
  items: { key: string; label: string; color: string }[];
  hidden: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 justify-center pt-1 pb-2 flex-wrap">
      {items.map(it => (
        <button
          key={it.key}
          onClick={() => onToggle(it.key)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${hidden[it.key] ? "opacity-30" : "opacity-100"}`}
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: it.color }} />
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ── Smart Y-axis domain for near-zero or empty data ──
function niceNWDomain(values: number[]): [number, number] {
  const nonZero = values.filter(v => v > 0);
  if (nonZero.length === 0) return [0, 1000];
  const max = Math.max(...nonZero);
  // choose a step size that keeps ticks readable
  const step = max <= 1000 ? 200 : max <= 5000 ? 500 : max <= 20000 ? 2000 : max <= 100000 ? 10000 : 50000;
  const niceMax = Math.ceil(max / step) * step;
  return [0, niceMax];
}

export default function AnalyticsPage() {
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y" | "ALL">("ALL");
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const [hiddenBars,  setHiddenBars]  = useState<Record<string, boolean>>({});
  const [logPage,     setLogPage]     = useState(0);
  const [showTour,    setShowTour]    = useState(false);
  const [tourKey,     setTourKey]     = useState(0);
  const LOG_PAGE_SIZE = 10;

  const toggle = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string) =>
    setter(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Filtered + derived net worth ──
  const filteredNW = React.useMemo(() => {
    if (!data) return [];
    if (timeRange === "ALL") return data.netWorthData;
    const n = { "3M": 3, "6M": 6, "1Y": 12 }[timeRange];
    return data.netWorthData.slice(-n);
  }, [data, timeRange]);

  const latestNW = filteredNW.length ? filteredNW[filteredNW.length - 1].value : null;

  const nwChange = React.useMemo(() => {
    if (filteredNW.length < 2) return null;
    const first = filteredNW[0].value;
    const last  = filteredNW[filteredNW.length - 1].value;
    if (!first) return null;
    const diff = last - first;
    return { diff, pct: (diff / first) * 100 };
  }, [filteredNW]);

  const authFetch = useAuthFetch();

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/analytics/data");
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [authFetch]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400 font-medium">Loading analytics…</p>
      </div>
    );
  }

  const trendsItems = [
    { key: "needs",  label: "Needs",   color: C.needs   },
    { key: "wants",  label: "Wants",   color: C.wants   },
    { key: "saved",  label: "Savings", color: C.savings  },
  ];
  const breakdownItems = [
    { key: "cash",        label: "Cash Accounts",    color: C.cash     },
    { key: "investments", label: "Investment Accounts", color: C.index  },
    { key: "physical",   label: "Physical Assets",  color: C.physical },
  ];

  // Most recent completed period of derived spending (needs two snapshots)
  const latestSpending = data.spendingData?.length
    ? data.spendingData[data.spendingData.length - 1]
    : null;

  // Does the breakdown have a live "Now" point?
  const hasLiveBreakdown = data.assetAllocationData?.slice(-1)[0]?.isLive ?? false;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <style>{`
        .recharts-wrapper * { outline: none !important; }
        .recharts-surface:focus { outline: none !important; }
      `}</style>

      <div className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">

        {/* ── Analytics Tour ── */}
        {showTour && (
          <AnalyticsTour
            key={tourKey}
            run={showTour}
            onFinish={() => setShowTour(false)}
          />
        )}

        {/* ── Header ── */}
        <FadeCard delay={0}>
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-2 duration-200">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2 mt-4">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
              <button
                id="tour-analytics-help"
                onClick={() => { setTourKey((k) => k + 1); setShowTour(true); }}
                title="Start analytics tour"
                className="group flex items-center justify-center w-7 h-7 rounded-full border-2 border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all duration-200 shadow-sm hover:shadow-emerald-200 hover:shadow-md shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              A complete picture of your financial health all powered by your regular check-ins.
            </p>
          </div>
        </FadeCard>

        {/* ── 3-column chart row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* ── Chart 1: Net Worth ── */}
          <div id="tour-net-worth-chart" className="h-full">
          <FadeCard delay={100} className="h-full">
          <Card className="h-[420px] flex flex-col shadow-sm border-slate-200 bg-white">
            <CardHeader className="pb-0 pt-5 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Worth</p>
                  {latestNW !== null ? (
                    <div className="mt-1">
                      <span className="text-3xl font-bold text-slate-900">${money(latestNW)}</span>
                      {nwChange && (
                        <span className={`ml-2 text-sm font-medium ${nwChange.diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {nwChange.diff >= 0 ? "+" : ""}${money(Math.abs(nwChange.diff))} ({nwChange.diff >= 0 ? "+" : ""}{nwChange.pct.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm mt-1">No data yet</p>
                  )}
                </div>
                <InfoTooltip
                  title="About Net Worth"
                  lines={[
                    { color: "#10b981", label: "Value", desc: "Total assets minus total liabilities" },
                    { color: "#94a3b8", label: "History", desc: "One snapshot locked in per month at check-in" },
                    { color: "#94a3b8", label: "Now", desc: "Live reading from your current account & asset balances" },
                  ]}
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 flex flex-col pt-2 px-3 pb-4">
              {/* Time filter */}
              <div className="flex gap-0 mb-2 px-2">
                <div className="flex flex-1 border border-slate-200 rounded-lg overflow-hidden">
                {(["3M", "6M", "1Y", "ALL"] as const).map((opt, i, arr) => (
                  <button
                    key={opt}
                    onClick={() => setTimeRange(opt)}
                    className={`flex-1 py-1 text-[11px] font-medium transition-colors border-r border-slate-200 last:border-r-0 ${
                      timeRange === opt
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                </div>
              </div>

              <div className="flex-1 min-h-0 [&_.recharts-surface]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                  {filteredNW.length > 0 ? (
                    <AreaChart data={filteredNW} margin={CHART_MARGIN}>
                      <defs>
                        <linearGradient id="gNW" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.netWorth} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={C.netWorth} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={TICK} dy={14} minTickGap={24} />
                      <YAxis
                        axisLine={false} tickLine={false} tick={TICK}
                        domain={niceNWDomain(filteredNW.map(d => d.value))}
                        tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
                      />
                      <Tooltip content={<NetWorthTooltip />} />
                      <Area type="monotone" dataKey="value" stroke={C.netWorth} strokeWidth={2.5} fill="url(#gNW)" />
                    </AreaChart>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data yet — submit your first check-in to get started.</div>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </FadeCard>
          </div>

          {/* ── Chart 2: Net Worth Breakdown ── */}
          <div id="tour-breakdown-chart" className="h-full">
          <FadeCard delay={200} className="h-full">
          <Card className="h-[420px] flex flex-col shadow-sm border-slate-200 bg-white">
            <CardHeader className="pb-0 pt-5 px-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Worth Breakdown</p>
                <div className="flex items-center gap-2">
                  <InfoTooltip
                    title="Where does this come from?"
                    lines={[
                      { color: "#0ea5e9", label: "Cash Accounts",      desc: "Financial Accounts tagged as Cash" },
                      { color: "#10b981", label: "Investment Accounts", desc: "Financial Accounts tagged as Investment" },
                      { color: "#f59e0b", label: "Physical Assets",     desc: "Entries in your Asset Ledger" },
                      { color: "#94a3b8", label: "Now column",          desc: "Live reading — always reflects your current balances" },
                    ]}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 flex flex-col pt-2 px-3 pb-4">
              <InteractiveLegend items={breakdownItems} hidden={hiddenBars} onToggle={k => toggle(setHiddenBars, k)} />
              <div className="flex-1 min-h-0 [&_.recharts-surface]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                  {data.assetAllocationData?.length > 0 ? (
                    <BarChart data={data.assetAllocationData} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={TICK} dy={14} minTickGap={10} />
                      <YAxis axisLine={false} tickLine={false} tick={TICK} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                      <Tooltip
                        // Recharts' default bar cursor is a solid grey block over the
                        // whole hovered band — with few data points that's the entire
                        // chart. The tooltip already names the column it's reading.
                        cursor={false}
                        formatter={(v: number, name: string) => {
                          const lm: Record<string, string> = { cash: "Cash Accounts", investments: "Investment Accounts", physical: "Physical Assets" };
                          return [`$${money(v)}`, lm[name] || name];
                        }}
                        contentStyle={TIP_STYLE}
                      />
                      <Bar hide={hiddenBars["cash"]}        dataKey="cash"        name="Cash Accounts"       stackId="a" fill={C.cash}     radius={[0,0,4,4]} />
                      <Bar hide={hiddenBars["investments"]} dataKey="investments" name="Investment Accounts" stackId="a" fill={C.index}   />
                      <Bar hide={hiddenBars["physical"]}   dataKey="physical"    name="Physical Assets"    stackId="a" fill={C.physical} radius={[4,4,0,0]} />
                    </BarChart>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </FadeCard>
          </div>

          {/* ── Chart 3: Weekly Allocation Trends ── */}
          <div id="tour-weekly-allocation-chart" className="h-full">
          <FadeCard delay={300} className="h-full">
          <Card className="h-[420px] flex flex-col shadow-sm border-slate-200 bg-white">
            <CardHeader className="pb-0 pt-5 px-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Weekly Allocation</p>
                <InfoTooltip
                  title="About Weekly Allocation"
                  lines={[
                    { color: "#4ade80", label: "Needs",   desc: "Essential expenses (rent, bills, groceries)" },
                    { color: "#2563eb", label: "Wants",   desc: "Discretionary & lifestyle spending" },
                    { color: "#16a34a", label: "Savings", desc: "Amount directed to savings or investments" },
                  ]}
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 flex flex-col pt-2 px-3 pb-4">
              {data.allocationTrendsData?.length > 0 ? (
                <>
                  <InteractiveLegend items={trendsItems} hidden={hiddenLines} onToggle={k => toggle(setHiddenLines, k)} />
                  <div className="flex-1 min-h-0 [&_.recharts-surface]:outline-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.allocationTrendsData} margin={CHART_MARGIN}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} dy={14} minTickGap={24} />
                        <YAxis axisLine={false} tickLine={false} tick={TICK} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                        <Tooltip
                          formatter={(v: number, name: string) => {
                            const lm: Record<string, string> = { needs: "Needs", wants: "Wants", saved: "Savings" };
                            return [`$${money(v)}`, lm[name] || name];
                          }}
                          contentStyle={TIP_STYLE}
                        />
                        <Line hide={hiddenLines["needs"]} type="monotone" dataKey="needs" name="Needs"   stroke={C.needs}   strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: C.needs   }} activeDot={{ r: 5 }} />
                        <Line hide={hiddenLines["wants"]} type="monotone" dataKey="wants" name="Wants"   stroke={C.wants}   strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: C.wants   }} activeDot={{ r: 5 }} />
                        <Line hide={hiddenLines["saved"]} type="monotone" dataKey="saved" name="Savings" stroke={C.savings} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: C.savings }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
                  <p className="text-slate-400 text-sm">Submit your first weekly check-in on the dashboard to see your spending trends here.</p>
                </div>
              )}
            </CardContent>
          </Card>
          </FadeCard>
          </div>

        </div>

        {/* ── Where it went — derived, never entered ── */}
        {latestSpending && (
          <FadeCard delay={350}>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Where It Went</p>
                  <p className="text-sm text-slate-500 mt-0.5">{latestSpending.month} — worked out from your check-ins, nothing to enter</p>
                </div>
                <InfoTooltip
                  title="How this is worked out"
                  lines={[
                    { color: "#10b981", label: "Earned",  desc: "Total income you logged in this period" },
                    { color: "#f59e0b", label: "Spent",   desc: "Income that did not end up as net worth" },
                    { color: "#0ea5e9", label: "Kept",    desc: "Share of income still yours at month end" },
                    { color: "#94a3b8", label: "Estimate", desc: "Market movement is excluded; a revalued asset can still skew it" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="px-5 py-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Earned</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">${money(latestSpending.income)}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Spent (est.)</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {latestSpending.estimatedSpending >= 0 ? `$${money(latestSpending.estimatedSpending)}` : "—"}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Kept</p>
                  <p className={`text-2xl font-bold mt-1 ${(latestSpending.savingsRate ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {latestSpending.savingsRate !== null ? `${latestSpending.savingsRate.toFixed(0)}%` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </FadeCard>
        )}

        {/* ── Income Log — connected beneath Weekly Allocation ── */}
        <FadeCard delay={400}>
        <div id="tour-income-log" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Income Log</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">All income events &amp; allocations</p>
            </div>
          </div>

          {/* Table */}
          {data.incomeLog && data.incomeLog.length > 0 ? (() => {
            const totalPages = Math.ceil(data.incomeLog.length / LOG_PAGE_SIZE);
            const pageRows  = data.incomeLog.slice(logPage * LOG_PAGE_SIZE, (logPage + 1) * LOG_PAGE_SIZE);
            return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="text-left px-5 py-2.5">Date</th>
                        <th className="text-left px-4 py-2.5">Source</th>
                        <th className="text-left px-4 py-2.5">Strategy</th>
                        <th className="text-right px-4 py-2.5">Total</th>
                        <th className="text-right px-4 py-2.5"><span style={{ color: C.needs }}>Needs</span></th>
                        <th className="text-right px-4 py-2.5"><span style={{ color: C.wants }}>Wants</span></th>
                        <th className="text-right px-5 py-2.5"><span style={{ color: C.savings }}>Savings</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, i) => (
                        <tr
                          key={row.id}
                          className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                            i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <td className="px-5 py-2.5 text-slate-500 text-xs whitespace-nowrap">{row.date}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">{row.source}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">{row.strategy}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">${money(row.amount)}</td>
                          <td className="px-4 py-2.5 text-right text-xs" style={{ color: C.needs }}>${money(row.needs)}</td>
                          <td className="px-4 py-2.5 text-right text-xs" style={{ color: C.wants }}>${money(row.wants)}</td>
                          <td className="px-5 py-2.5 text-right text-xs font-medium" style={{ color: C.savings }}>${money(row.savings)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Showing {logPage * LOG_PAGE_SIZE + 1}–{Math.min((logPage + 1) * LOG_PAGE_SIZE, data.incomeLog.length)} of {data.incomeLog.length} events
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLogPage(p => Math.max(0, p - 1))}
                      disabled={logPage === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-slate-600 px-2">{logPage + 1} / {totalPages}</span>
                    <button
                      onClick={() => setLogPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={logPage >= totalPages - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            );
          })() : (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              No income events logged yet.
            </div>
          )}
        </div>
        </FadeCard>

        {/* ── Asset + Investment Portfolio (side by side) ── */}
        <FadeCard delay={500}>
          <div id="tour-portfolio-panel">
            <PortfolioPanel />
          </div>
        </FadeCard>

        <FadeCard delay={600}>
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Gradient shimmer strip at the top */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-indigo-400" />

          <div className="px-6 pt-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">AI Financial Insights</p>
                  <p className="text-[11px] text-slate-400">Powered by your real data</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                <Lock className="w-3 h-3" /> Coming Soon
              </span>
            </div>

            {/* Prompt suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {AI_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  disabled
                  className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full cursor-not-allowed select-none hover:bg-slate-100 transition-colors"
                >
                  <span className="text-slate-400">{p.icon}</span>
                  {p.text}
                  <ChevronRight className="w-3 h-3 text-slate-300 ml-0.5" />
                </button>
              ))}
            </div>

            {/* Fake chat input */}
            <div className="relative flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-not-allowed">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 shrink-0" />
              <p className="flex-1 text-sm text-slate-400 select-none">
                Ask anything about your finances…
              </p>
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <Send className="w-3.5 h-3.5 text-slate-400" />
              </div>
              {/* Frosted overlay */}
              <div className="absolute inset-0 rounded-xl" />
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-3">
              This feature is in development. It will analyse your spending patterns, suggest savings targets, and answer questions about your financial health.
            </p>
          </div>
        </div>
        </FadeCard>

      </div>
    </div>
  );
}
