"use client";

import { useState, React } from "react";
import SplitDisplay from "./components/SplitDisplay";
import BudgetForm from "./components/BudgetForm";

function BudgetPage() {
  const [form, setForm] = useState({
    income: "",
    needsPct: "",
    wantsPct: "",
    savingsPct: "",
  });

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
    console.log(form);
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
    } catch (error) {
      console.error("POST ERROR:", error);
    }
  }

  return (
    <div>
      <BudgetForm
        form={form}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
      />
      <SplitDisplay data={splitDisplay} />
    </div>
  );
}
export default BudgetPage;
