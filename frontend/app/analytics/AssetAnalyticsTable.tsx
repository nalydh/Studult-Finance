"use client";

import React, { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Package, Calendar, DollarSign } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { API_BASE } from "@/lib/api";
import { useAuthFetch } from "@/hooks/useAuthFetch";

/* ── Types ── */
interface Asset {
  id: number;
  name: string;
  category: string;
  purchase_price: number;
  market_value: number | null;
  date_acquired: string;
  is_sold: boolean;
  sale_price?: number | null;
  date_sold?: string | null;
}

interface AssetGroup {
  category: string;
  assets: Asset[];
  totalCost: number;
  totalValue: number;
  totalReturn: number;
  returnPct: number;
}

const TIP_STYLE = {
  borderRadius: "8px", border: "none",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)", fontSize: "12px",
};
const TICK = { fill: "#64748b", fontSize: 11 };
const MARGIN = { top: 8, right: 16, left: 0, bottom: 28 };

/* ── Asset Category Modal ── */
function AssetCategoryModal({
  group,
  onClose,
}: {
  group: AssetGroup;
  onClose: () => void;
}) {
  const isGain = group.totalReturn >= 0;

  // Build a simple timeline chart: purchase date → now (or sale date)
  const chartData = group.assets
    .slice()
    .sort((a, b) => new Date(a.date_acquired).getTime() - new Date(b.date_acquired).getTime())
    .map((a) => ({
      label: new Date(a.date_acquired).toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
      cost: a.purchase_price,
      value: a.market_value ?? a.purchase_price,
      gain: (a.market_value ?? a.purchase_price) - a.purchase_price,
    }));

  // Cumulative running totals
  let runningCost = 0;
  let runningValue = 0;
  const cumulativeData = chartData.map((d) => {
    runningCost += d.cost;
    runningValue += d.value;
    return { ...d, cumulativeCost: runningCost, cumulativeValue: runningValue };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
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

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Cost</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              ${group.totalCost.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Current Value</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              ${group.totalValue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Return</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isGain
                ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                : <TrendingDown className="w-4 h-4 text-red-500" />}
              <p className={`text-xl font-bold ${isGain ? "text-emerald-600" : "text-red-600"}`}>
                {isGain ? "+" : ""}${Math.abs(group.totalReturn).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
              </p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isGain ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {isGain ? "+" : ""}{group.returnPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Growth chart */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Value vs Cost Over Time</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={MARGIN}>
                <defs>
                  <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} dy={14} />
                <YAxis axisLine={false} tickLine={false} tick={TICK}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `$${v.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
                    name === "cumulativeValue" ? "Market Value" : "Total Cost",
                  ]}
                  contentStyle={TIP_STYLE}
                />
                <Area type="monotone" dataKey="cumulativeCost"  stroke="#94a3b8" strokeWidth={2} fill="url(#gCost)" />
                <Area type="monotone" dataKey="cumulativeValue" stroke="#10b981" strokeWidth={2.5} fill="url(#gVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Individual assets table */}
        <div className="px-6 pb-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 mt-2">Individual Assets</p>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="text-left px-4 py-2.5">Name</th>
                  <th className="text-right px-4 py-2.5">Cost</th>
                  <th className="text-right px-4 py-2.5">Value</th>
                  <th className="text-right px-4 py-2.5">Return</th>
                  <th className="text-right px-4 py-2.5">ROI</th>
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
                      <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                        ${a.purchase_price.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-800 font-medium tabular-nums">
                        ${mv.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${pos ? "text-emerald-600" : "text-red-600"}`}>
                        {pos ? "+" : ""}${Math.abs(ret).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums text-xs ${pos ? "text-emerald-600" : "text-red-600"}`}>
                        {pos ? "+" : ""}{roi.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */

export function AssetAnalyticsTable() {
  const authFetch = useAuthFetch();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<AssetGroup | null>(null);

  useEffect(() => {
    authFetch("/assets/")
      .then((r) => r.json())
      .then((data) => setAssets(Array.isArray(data) ? data.filter((a: Asset) => !a.is_sold) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authFetch]);

  // Group by category
  const groups: AssetGroup[] = Object.entries(
    assets.reduce<Record<string, Asset[]>>((acc, a) => {
      (acc[a.category] = acc[a.category] ?? []).push(a);
      return acc;
    }, {})
  ).map(([category, grpAssets]) => {
    const totalCost = grpAssets.reduce((s, a) => s + a.purchase_price, 0);
    const totalValue = grpAssets.reduce((s, a) => s + (a.market_value ?? a.purchase_price), 0);
    const totalReturn = totalValue - totalCost;
    const returnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    return { category, assets: grpAssets, totalCost, totalValue, totalReturn, returnPct };
  });

  if (loading) return null;
  if (groups.length === 0) return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Asset Portfolio</p>
        <p className="text-sm font-semibold text-slate-900 mt-0.5">Holdings by category</p>
      </div>
      <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
        <Package className="w-4 h-4 mr-2" /> No assets logged yet.
      </div>
    </div>
  );

  const grandTotalCost = groups.reduce((s, g) => s + g.totalCost, 0);
  const grandTotalValue = groups.reduce((s, g) => s + g.totalValue, 0);
  const grandReturn = grandTotalValue - grandTotalCost;
  const grandROI = grandTotalCost > 0 ? (grandReturn / grandTotalCost) * 100 : 0;

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Asset Portfolio</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">Holdings by category — click to explore</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Return</p>
            <p className={`text-sm font-bold ${grandReturn >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {grandReturn >= 0 ? "+" : ""}${Math.abs(grandReturn).toLocaleString("en-AU", { minimumFractionDigits: 2 })} ({grandROI.toFixed(1)}%)
            </p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="text-left px-5 py-2.5">Category</th>
              <th className="text-right px-4 py-2.5">Items</th>
              <th className="text-right px-4 py-2.5">Total Cost</th>
              <th className="text-right px-4 py-2.5">Market Value</th>
              <th className="text-right px-5 py-2.5">Return</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => {
              const pos = g.totalReturn >= 0;
              return (
                <tr
                  key={g.category}
                  onClick={() => setSelectedGroup(g)}
                  className={`border-b border-slate-50 cursor-pointer hover:bg-amber-50/60 transition-colors group ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-medium text-slate-800">{g.category}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-600 transition-opacity">→ Details</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{g.assets.length}</td>
                  <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                    ${g.totalCost.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-800 font-medium tabular-nums">
                    ${g.totalValue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`font-medium ${pos ? "text-emerald-600" : "text-red-600"}`}>
                        {pos ? "+" : ""}${Math.abs(g.totalReturn).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${pos ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {pos ? "+" : ""}{g.returnPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</td>
              <td className="px-4 py-2.5 text-right text-sm text-slate-500">{assets.length}</td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-700 tabular-nums">
                ${grandTotalCost.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-900 tabular-nums">
                ${grandTotalValue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-5 py-2.5 text-right">
                <span className={`text-sm font-bold ${grandReturn >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {grandReturn >= 0 ? "+" : ""}${Math.abs(grandReturn).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal */}
      {selectedGroup && (
        <AssetCategoryModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
      )}
    </>
  );
}
