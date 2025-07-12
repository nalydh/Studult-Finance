"use client";

import { useState, React } from "react";

function BudgetPage() {
  const [form, setForm] = useState({
    income: null,
    needsPct: null,
    wantsPct: null,
    savingsPct: null,
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
      // TODO: Store this in state to show user results

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
      <label>Weekly Income:</label>
      <input type="number" name="income" onChange={handleChange} />

      <h2>Calculate Split</h2>
      <label>Needs: </label>
      <input type="number" name="needsPct" onChange={handleChange} />

      <label>Wants: </label>
      <input type="number" name="wantsPct" onChange={handleChange} />

      <label>Savings: </label>
      <input type="number" name="savingsPct" onChange={handleChange} />

      <h2>Savings Split Breakdown</h2>
      {Object.entries(splitDisplay).map(([key, value]) => (
        <p key={key}>
          {key.charAt(0).toUpperCase() + key.slice(1) + ": " + value}
        </p>
      ))}
      <button type="submit" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
export default BudgetPage;
