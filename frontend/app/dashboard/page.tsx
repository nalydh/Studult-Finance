/*
Dashboard Page:
  Main dashboard layout containing various financial management components.
  TODO: Add more dashboard widgets (portfolio summary, investment tracker, etc. )
*/

"use client";

import React from "react";
import BudgetForm from "./components/budgetsplitter/components/BudgetForm";

function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1">
          <BudgetForm />
        </div>
        {/* Future dashboard components will go here */}
      </div>
    </div>
  );
}

export default DashboardPage;
