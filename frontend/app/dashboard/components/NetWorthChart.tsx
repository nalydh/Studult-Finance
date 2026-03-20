"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { API_BASE } from "@/lib/api";
import { useAuthFetch } from "@/hooks/useAuthFetch";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Snapshot {
  id: number;
  snapshot_date: string;
  total_cash: number;
  total_investments: number;
  total_liabilities: number;
  total_assets: number;
  net_worth: number;
}

export function NetWorthChart() {
  const authFetch = useAuthFetch();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y" | "ALL">("ALL");

  const filteredSnapshots = useMemo(() => {
    if (timeRange === "ALL") return snapshots;
    const now = new Date();
    const monthsMap = { "3M": 3, "6M": 6, "1Y": 12 } as const;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsMap[timeRange], now.getDate());
    return snapshots.filter((s) => new Date(s.snapshot_date) >= cutoff);
  }, [snapshots, timeRange]);

  useEffect(() => {
    async function fetchSnapshots() {
      try {
        const res = await authFetch("/snapshots/");
        const data = await res.json();
        if (Array.isArray(data)) setSnapshots(data);
      } catch (err) {
        console.error("Error fetching snapshots:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSnapshots();
  }, [authFetch]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Loading chart…
        </CardContent>
      </Card>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Net Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm pb-6">
          <p>No data to chart yet.</p>
          <p className="mt-1">Your net worth history will appear here after your first check-in.</p>
        </CardContent>
      </Card>
    );
  }

  const labels = filteredSnapshots.map((s) =>
    new Date(s.snapshot_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Net Worth",
        data: filteredSnapshots.map((s) => s.net_worth),
        borderColor: "rgb(16, 185, 129)",    // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(16, 185, 129)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) =>
            `Net Worth: $${ctx.parsed.y.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        ticks: {
          font: { size: 11 },
          callback: (value: number | string) => {
            const num = typeof value === "string" ? parseFloat(value) : value;
            if (Math.abs(num) >= 1000) return `$${(num / 1000).toFixed(0)}k`;
            return `$${num}`;
          },
        },
        grid: { color: "rgba(0, 0, 0, 0.06)" },
      },
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Net Worth Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <Line data={chartData} options={options} />
        </div>
        <div className="flex justify-between mt-3 gap-4">
          {(["3M", "6M", "1Y", "ALL"] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={timeRange === option ? "secondary" : "ghost"}
              className="flex-1"
              onClick={() => setTimeRange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
