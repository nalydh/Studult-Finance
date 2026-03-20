"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, TrendingUp, Package, Trash2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  date_acquired: string;
  is_sold: boolean;
}

interface AssetGroup {
  category: string;
  assets: Asset[];
  totalCost: number;
  totalValue: number;
  totalReturn: number;
  returnPct: number;
}

interface Contribution {
  id: number;
  account_id: number;
  date: string;
  amount: number;
  balance_at_date: number;
  note: string | null;
}

/* ── Shared chart constants ── */
const TIP_STYLE = {
  borderRadius: "8px", border: "none",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)", fontSize: "12px",
};
const TICK = { fill: "#64748b", fontSize: 11 };
const MARGIN = { top: 12, right: 20, left: 0, bottom: 28 };

function fmt(n: number) {
  return n.toLocaleString("en-AU", { minimumFractionDigits: 2 });
}

/* ══════════════════════════════════════════════════════════════════
   ASSET GROUP MODAL
══════════════════════════════════════════════════════════════════ */
function AssetGroupModal({ group, onClose }: { group: AssetGroup; onClose: () => void }) {
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const isGain = group.totalReturn >= 0;

  const toggle = (key: string) =>
    setHiddenLines((p) => ({ ...p, [key]: !p[key] }));

  // Build time-series from individual assets sorted by acquisition date
  // Each point adds one asset to the running total
  let runningCost = 0;
  let runningValue = 0;
  const chartData = [...group.assets]
    .sort((a, b) => new Date(a.date_acquired).getTime() - new Date(b.date_acquired).getTime())
    .map((a) => {
      runningCost  += a.purchase_price;
      runningValue += a.market_value ?? a.purchase_price;
      return {
        label: new Date(a.date_acquired).toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
        cost: runningCost,
        value: runningValue,
      };
    });

  // Compute smart domain — show meaningful diffs
  const allVals = chartData.flatMap((d) => [d.cost, d.value]).filter(Boolean);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const pad = (maxVal - minVal) * 0.1 || maxVal * 0.05;
  const domain: [number, number] = [Math.max(0, minVal - pad), maxVal + pad];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{group.category}</h2>
              <p className="text-xs text-slate-400">{group.assets.length} asset{group.assets.length !== 1 && "s"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Cost</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${fmt(group.totalCost)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Market Value</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${fmt(group.totalValue)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Return</p>
            <p className={`text-xl font-bold mt-0.5 ${isGain ? "text-emerald-600" : "text-red-600"}`}>
              {isGain ? "+" : ""}${fmt(Math.abs(group.totalReturn))}
            </p>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${isGain ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {isGain ? "+" : ""}{group.returnPct.toFixed(2)}% ROI
            </span>
          </div>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-2 px-6 pt-4">
          {[
            { key: "value", label: "Market Value", color: "#10b981" },
            { key: "cost",  label: "Total Cost",   color: "#94a3b8" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                hiddenLines[key]
                  ? "bg-slate-50 text-slate-400 border-slate-200 opacity-50"
                  : "bg-white text-slate-700 border-slate-300 shadow-sm"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hiddenLines[key] ? "#cbd5e1" : color }} />
              {label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="px-6 pt-3 pb-2">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={MARGIN}>
                <defs>
                  <linearGradient id="agValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="agCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} dy={14} minTickGap={20} />
                <YAxis
                  axisLine={false} tickLine={false} tick={TICK} domain={domain}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `$${fmt(v)}`,
                    name === "value" ? "Market Value" : "Total Cost",
                  ]}
                  contentStyle={TIP_STYLE}
                />
                {!hiddenLines["cost"]  && <Area type="monotone" dataKey="cost"  stroke="#94a3b8" strokeWidth={2}   fill="url(#agCost)"  />}
                {!hiddenLines["value"] && <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#agValue)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-asset breakdown */}
        <div className="px-6 pb-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Individual Assets</p>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="text-left px-4 py-2.5">Name</th>
                  <th className="text-right px-4 py-2.5">Cost</th>
                  <th className="text-right px-4 py-2.5">Value</th>
                  <th className="text-right px-4 py-2.5">Return</th>
                </tr>
              </thead>
              <tbody>
                {group.assets.map((a) => {
                  const mv = a.market_value ?? a.purchase_price;
                  const ret = mv - a.purchase_price;
                  const roi = a.purchase_price > 0 ? (ret / a.purchase_price) * 100 : 0;
                  const pos = ret >= 0;
                  return (
                    <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{a.name}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">${fmt(a.purchase_price)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-800 font-medium tabular-nums">${fmt(mv)}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${pos ? "text-emerald-600" : "text-red-600"}`}>
                        {pos ? "+" : ""}${fmt(Math.abs(ret))}
                        <span className="text-[10px] ml-1 opacity-70">({pos ? "+" : ""}{roi.toFixed(1)}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Update Market Value via Edit Asset in the dashboard to move the chart.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   INVESTMENT ACCOUNT MODAL
══════════════════════════════════════════════════════════════════ */
function InvestmentModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const authFetch = useAuthFetch();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setHiddenLines((p) => ({ ...p, [key]: !p[key] }));

  const fetchContributions = useCallback(async () => {
    const res = await authFetch(`/investment-contributions/${account.id}`);
    const data = await res.json();
    setContributions(Array.isArray(data) ? data : []);
  }, [account.id, authFetch]);

  useEffect(() => { fetchContributions(); }, [fetchContributions]);

  async function handleDelete(entryId: number) {
    await authFetch(`/investment-contributions/${entryId}`, { method: "DELETE" });
    fetchContributions();
  }

  // Build chart data from contribution history
  const chartData = contributions.map((c) => ({
    label: new Date(c.date).toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
    value: c.balance_at_date,
    contributions: contributions
      .filter((x) => x.date <= c.date)
      .reduce((s, x) => s + x.amount, 0),
    // raw contribution for tooltip
    deposited: c.amount,
  }));

  // If no history yet, show a simple 2-point chart using stored totals
  const displayData = chartData.length > 0
    ? chartData
    : account.total_contributions > 0
      ? [
          { label: "Contributed", value: account.total_contributions, contributions: account.total_contributions, deposited: 0 },
          { label: "Now",         value: account.balance,             contributions: account.total_contributions, deposited: 0 },
        ]
      : [{ label: "Now", value: account.balance, contributions: 0, deposited: 0 }];

  // Smart Y-axis domain
  const allVals = displayData.flatMap((d) => [d.value, d.contributions]).filter(Boolean);
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const pad = (maxVal - minVal) * 0.1 || maxVal * 0.05;
  const domain: [number, number] = [Math.max(0, minVal - pad), maxVal + pad];

  const totalReturn = account.balance - (account.total_contributions ?? 0);
  const roi = (account.total_contributions ?? 0) > 0
    ? (totalReturn / account.total_contributions) * 100 : 0;
  const isGain = totalReturn >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{account.name}</h2>
              <p className="text-xs text-slate-400">Investment Account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Current Value</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${fmt(account.balance)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Contributed</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">${fmt(account.total_contributions ?? 0)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Return</p>
            <p className={`text-xl font-bold mt-0.5 ${isGain ? "text-emerald-600" : "text-red-600"}`}>
              {isGain ? "+" : ""}${fmt(Math.abs(totalReturn))}
            </p>
            {(account.total_contributions ?? 0) > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${isGain ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {isGain ? "+" : ""}{roi.toFixed(2)}% ROI
              </span>
            )}
          </div>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-2 px-6 pt-4">
          {[
            { key: "value",         label: "Portfolio Value", color: "#3b82f6" },
            { key: "contributions", label: "Cumulative Contributions", color: "#94a3b8" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                hiddenLines[key]
                  ? "bg-slate-50 text-slate-400 border-slate-200 opacity-50"
                  : "bg-white text-slate-700 border-slate-300 shadow-sm"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hiddenLines[key] ? "#cbd5e1" : color }} />
              {label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="px-6 pt-3 pb-1">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={MARGIN}>
                <defs>
                  <linearGradient id="ivValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ivContrib" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} dy={14} minTickGap={20} />
                <YAxis
                  axisLine={false} tickLine={false} tick={TICK} domain={domain}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `$${fmt(v)}`,
                    name === "value" ? "Portfolio Value" : "Cumulative Contributions",
                  ]}
                  contentStyle={TIP_STYLE}
                />
                {!hiddenLines["contributions"] && (
                  <Area type="monotone" dataKey="contributions" stroke="#94a3b8" strokeWidth={2} fill="url(#ivContrib)" />
                )}
                {!hiddenLines["value"] && (
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ivValue)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {chartData.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center -mt-1 mb-2">
              Log contributions below to build a real time-series chart.
            </p>
          )}
        </div>

        {/* Contribution history */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Contribution History</p>
            <span className="text-[11px] text-slate-400">Logged via monthly check-in</span>
          </div>

          {/* Log table */}
          {contributions.length > 0 ? (
            <div className="rounded-xl border border-slate-100 overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-right px-4 py-2">Contributed</th>
                    <th className="text-right px-4 py-2">Balance</th>
                    <th className="text-left px-4 py-2">Note</th>
                    <th className="w-8 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c, i) => (
                    <tr key={c.id} className={`border-t border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                      <td className="px-4 py-2 text-slate-500 tabular-nums">{c.date}</td>
                      <td className="px-4 py-2 text-right font-medium text-blue-700 tabular-nums">${fmt(c.amount)}</td>
                      <td className="px-4 py-2 text-right text-slate-800 tabular-nums">${fmt(c.balance_at_date)}</td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{c.note ?? "—"}</td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 text-center py-3">
              No entries yet — complete your first monthly check-in to start tracking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDE-BY-SIDE PANEL (exported — used in analytics page)
══════════════════════════════════════════════════════════════════ */
export function PortfolioPanel() {
  const authFetch = useAuthFetch();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<AssetGroup | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    authFetch("/assets/")
      .then((r) => r.json())
      .then((d) => setAssets(Array.isArray(d) ? d.filter((a: Asset) => !a.is_sold) : []))
      .catch(console.error)
      .finally(() => setLoadingAssets(false));

    authFetch("/accounts/")
      .then((r) => r.json())
      .then((d) => setAccounts(Array.isArray(d) ? d.filter((a: Account) => a.category === "Investment") : []))
      .catch(console.error)
      .finally(() => setLoadingAccounts(false));
  }, [authFetch]);

  // Group assets by category
  const assetGroups: AssetGroup[] = Object.entries(
    assets.reduce<Record<string, Asset[]>>((acc, a) => {
      (acc[a.category] = acc[a.category] ?? []).push(a);
      return acc;
    }, {})
  ).map(([category, grpAssets]) => {
    const totalCost  = grpAssets.reduce((s, a) => s + a.purchase_price, 0);
    const totalValue = grpAssets.reduce((s, a) => s + (a.market_value ?? a.purchase_price), 0);
    const totalReturn = totalValue - totalCost;
    const returnPct   = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    return { category, assets: grpAssets, totalCost, totalValue, totalReturn, returnPct };
  });

  const loading = loadingAssets || loadingAccounts;
  if (loading) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Asset Portfolio ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Asset Portfolio</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">Physical assets by category</p>
          </div>
          {assetGroups.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
              <Package className="w-4 h-4 mr-2" /> No assets logged yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {assetGroups.map((g) => {
                const pos = g.totalReturn >= 0;
                return (
                  <li key={g.category} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{g.category}</p>
                        <p className="text-[11px] text-slate-400">{g.assets.length} item{g.assets.length !== 1 && "s"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">${fmt(g.totalValue)}</p>
                        <p className={`text-[11px] font-medium ${pos ? "text-emerald-600" : "text-red-600"}`}>
                          {pos ? "+" : ""}{g.returnPct.toFixed(1)}%
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedGroup(g)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Investment Accounts ── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Investment Accounts</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">Returns &amp; contributions</p>
          </div>
          {accounts.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
              <TrendingUp className="w-4 h-4 mr-2" /> No investment accounts found.
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {accounts.map((acc) => {
                const ret = acc.balance - (acc.total_contributions ?? 0);
                const roi = (acc.total_contributions ?? 0) > 0 ? (ret / acc.total_contributions) * 100 : null;
                const pos = ret >= 0;
                return (
                  <li key={acc.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{acc.name}</p>
                        <p className="text-[11px] text-slate-400">${fmt(acc.balance)} current</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {roi !== null && (
                        <div className="text-right">
                          <p className={`text-[11px] font-medium ${pos ? "text-emerald-600" : "text-red-600"}`}>
                            {pos ? "+" : ""}{roi.toFixed(1)}% ROI
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedAccount(acc)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedGroup   && <AssetGroupModal   group={selectedGroup}     onClose={() => setSelectedGroup(null)}   />}
      {selectedAccount && <InvestmentModal   account={selectedAccount} onClose={() => setSelectedAccount(null)} />}
    </>
  );
}
