"use client";

import React, { useState, useEffect } from "react";
import { Joyride, STATUS } from "react-joyride";

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

interface AnalyticsTourProps {
  run: boolean;
  onFinish: () => void;
}

export default function AnalyticsTour({ run, onFinish }: AnalyticsTourProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [steps] = useState<any[]>([
    {
      target: "body",
      placement: "center",
      title: "Analytics Overview",
      content:
        "This page gives you a bird's-eye view of your financial health over time. Every chart here is driven by the data you log during your weekly check-ins.",
      disableBeacon: true,
    },
    {
      target: "#tour-net-worth-chart",
      title: "Net Worth Over Time",
      content:
        "A monthly snapshot of your total assets minus liabilities. Track your wealth trajectory over different time periods.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "#tour-breakdown-chart",
      title: "Net Worth Breakdown",
      content:
        "See exactly where your wealth lives — split across Cash Accounts, Investment Accounts, and Physical Assets.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "#tour-weekly-allocation-chart",
      title: "Weekly Allocation Trends",
      content:
        "Each line tracks how much of your weekly check-in income went to Needs, Wants, and Savings. Spot patterns and see if your spending habits are trending in the right direction.",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "#tour-income-log",
      title: "Income Log",
      content:
        "Every check-in you submit is recorded here with a full breakdown of how that income was allocated across Needs, Wants, and Savings. When you sell an asset, that event will also be recorded here.",
      placement: "top",
      disableBeacon: true,
    },
    {
      target: "#tour-portfolio-panel",
      title: "Portfolio & Assets",
      content:
        "Your account and asset ledger entries are summarised here, giving you a snapshot of your current financial positions across all tracked categories.",
      placement: "top",
      disableBeacon: true,
    },
  ]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  if (!mounted) return null;

  const JoyrideComponent = Joyride as any;

  return (
    <JoyrideComponent
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      showProgress
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      scrollToFirstStep
      floaterProps={{ disableAnimation: false }}
    />
  );
}
