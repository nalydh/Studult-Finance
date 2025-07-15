"use client";

import { useState, React } from "react";
import SplitDisplay from "./components/SplitDisplay";
import BudgetForm from "./components/BudgetForm";
import DoughnutChart from "./components/DoughnutChart";

function BudgetPage() {
  const [form, setForm] = useState({
    income: "",
    needsPct: "",
    wantsPct: "",
    savingsPct: "",
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [splitDisplay, setSplitDisplay] = useState({
    needs: 0,
    wants: 0,
    savings: 0,
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: Number(e.target.value),
    });
    setHasSubmitted(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/budget/split", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          income: form.income,
          needs_pct: form.needsPct,
          wants_pct: form.wantsPct,
          savings_pct: form.savingsPct,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Received split:", data);

      setSplitDisplay({
        needs: data.needs,
        wants: data.wants,
        savings: data.savings,
      });
      setHasSubmitted(true);
    } catch (error) {
      console.error("POST ERROR:", error);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Form */}
        <div className="flex-1">
          <BudgetForm
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </div>
        {/* Right: Split Display + Doughnut */}
        <div className="flex-1 flex flex-col gap-6">
          <SplitDisplay data={splitDisplay} />
          {hasSubmitted && (
            <DoughnutChart
              data={{
                needsPct: form.needsPct,
                wantsPct: form.wantsPct,
                savingsPct: form.savingsPct,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
export default BudgetPage;
