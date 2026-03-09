/*
Dashboard Page
*/

"use client";

import React from "react";
import BudgetForm from "./components/budgetsplitter/components/BudgetForm";
import AssetLedger from "./components/assetledger/AssetLedger";
import AccountLedger from "./components/accountledger/AccountLedger";
import { CheckInBanner } from "./components/CheckInBanner";
import { NetWorthCard } from "./components/NetWorthCard";
import { NetWorthChart } from "./components/NetWorthChart";

function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <CheckInBanner />

      {/* Two-column layout */}
      <div className="flex flex-col xl:flex-row gap-4 mt-4">
        {/* Left column: Budget Splitter → Accounts → Assets */}
        <div className="flex-1 min-w-0 space-y-4">
          <BudgetForm />
          <AccountLedger />
          <AssetLedger />
        </div>

        {/* Right column: Net Worth Card → Net Worth Chart */}
        <div className="w-full xl:w-[400px] shrink-0 space-y-4 xl:sticky xl:top-6 xl:self-start">
          <NetWorthCard />
          <NetWorthChart />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
