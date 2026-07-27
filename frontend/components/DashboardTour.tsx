"use client";

import React, { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Joyride, EVENTS, STATUS } from "react-joyride";
import { useAuthFetch } from "@/hooks/useAuthFetch";

// Custom modern tooltip component for the tour
function CustomTooltip({ index, step, skipProps, primaryProps, tooltipProps, backProps, isLastStep }: any) {
  return (
    <div
      {...tooltipProps}
      className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-2xl rounded-2xl w-[340px] p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300"
    >
      {step.title && (
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
          {step.title}
        </h3>
      )}
      <div className="text-slate-600 text-[15px] leading-relaxed">{step.content}</div>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
        <button
          {...skipProps}
          className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
        >
          Skip Tour
        </button>
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DashboardTourProps {
  run: boolean;
  onFinish: () => void;
}

export default function DashboardTour({ run, onFinish }: DashboardTourProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [steps] = useState<any[]>([
    {
      target: "body",
      placement: "center",
      title: <span className="flex items-center gap-2">Welcome to Studult Finance! <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" /></span>,
      content:
        "Consistent tracking is the key to financial success. Ideally every payday (or whenever you decide to process your finances), you'll start here by entering your net income.",
    },
    {
      target: "#tour-budget-splitter",
      title: "Your Financial Compass",
      content:
        "This tool automatically splits your income into three designated wallets. Giving every dollar a purpose helps you manage your cash flow effortlessly.",
      placement: "right",
    },
    {
      target: "#tour-budget-items",
      title: "Automate Your Fixed Costs",
      content:
        "Expand each wallet to add your regular fixed expenses — e.g. Needs include rent/fuel, Wants include subscriptions, Savings include automated investing or emergency fund. These are automatically deducted from your weekly budget.",
      placement: "right",
    },
    {
      target: "#tour-budget-settings",
      title: "Adapt on the Fly",
      content:
        "Need to restructure? Tap settings to adjust your core budget splits or income details as your financial situation evolves over time.",
      placement: "bottom",
    },
    {
      target: "#tour-submit-button",
      title: "Lock it In",
      content:
        "Submit your net income every week to log your cash allocation. This ensures you stay perfectly disciplined from paycheck to paycheck.",
      placement: "top",
    },
    {
      target: "#tour-account-ledger",
      title: "Track Your Liquidity",
      content:
        "Record your individual financial accounts (spending, savings, investments) alongside short-term liabilities (like credit cards or HECS) to cleanly monitor your active cash pool.",
      placement: "left",
    },
    {
      target: "#tour-asset-ledger",
      title: "Build Your Net Worth",
      content:
        "Inventory your liquid assets and larger investments here. Monitoring total market value gives you a remarkably clear picture of your true financial health.",
      placement: "left",
    },
  ]);

  const authFetch = useAuthFetch();
  const completedRef = useRef(false);

  // v3 renamed the `callback` prop to `onEvent`; the old prop is silently
  // ignored, which left tutorial_completed forever false in the DB.
  const handleEvent = async (data: any) => {
    if (data.type !== EVENTS.TOUR_END || completedRef.current) return;
    if (data.status !== STATUS.FINISHED && data.status !== STATUS.SKIPPED) return;
    completedRef.current = true;

    try {
      const res = await authFetch("/budget/preferences", {
        method: "PUT",
        body: JSON.stringify({ tutorial_completed: true }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("Failed to persist tutorial completion:", res.status, detail);
      }
    } catch (e) {
      console.error("Failed to update tutorial completion status:", e);
    }
    onFinish();
  };

  if (!mounted) return null;

  return (
    <Joyride
      onEvent={handleEvent}
      continuous
      run={run}
      steps={steps}
      tooltipComponent={CustomTooltip}
      options={{
        skipBeacon: true,
        buttons: ["back", "primary", "skip"],
      }}
    />
  );
}
