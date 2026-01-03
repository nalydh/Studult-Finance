/*
Weekly Budget Planner:
  Enables users to input their income and view budget splits.
  TODO: Provide a summary of the savings breakdown into various goals i.e. emergency fund, investments.
*/

"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import BudgetForm from "./components/BudgetForm";

export interface SplitData {
  needs: number;
  wants: number;
  savings: number;
}

function WalletPage() {
  const [income, setIncome] = useState("");
  const [splitData, setSplitData] = useState<SplitData>({
    needs: 0,
    wants: 0,
    savings: 0,
  });
  const [splitAmounts, setSplitAmounts] = useState<SplitData>({
    needs: 0,
    wants: 0,
    savings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSplit() {
      try {
        const result = await fetch("http://localhost:8000/budget/preferences");
        const data = await result.json();

        setSplitData({
          needs: data.needs,
          wants: data.wants,
          savings: data.savings,
        });
      } catch (error) {
        console.error("Error fetching split: ", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSplit();
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setIncome(e.target.value);
    console.log(income);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/budget/split", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          income: income,
          needs_pct: splitData.needs,
          wants_pct: splitData.wants,
          savings_pct: splitData.savings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Received split:", data);

      setSplitAmounts({
        needs: data.needs,
        wants: data.wants,
        savings: data.savings,
      });
    } catch (error) {
      console.error("POST ERROR:", error);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-lg text-muted">
          Loading your budget preferences...
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1">
            <BudgetForm
              income={income}
              handleSubmit={handleSubmit}
              handleChange={handleChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletPage;
