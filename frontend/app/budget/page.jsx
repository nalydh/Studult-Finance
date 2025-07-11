"use client";

import { useState, React } from "react";

function BudgetPage() {
  const [form, setForm] = useState({
    income: null,
    needsPct: null,
    wantsPct: null,
    savingsPct: null,
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    console.log(form);
  }

  function handleSubmit() {
    console.log("Submitted!");
  }

  return (
    <div>
      <label>Weekly Income:</label>
      <input type="number" name="income" onChange={handleChange} />

      <h2>Savings Split</h2>
      <label>Needs: </label>
      <input type="number" name="needsPct" onChange={handleChange} />

      <label>Wants: </label>
      <input type="number" name="wantsPct" onChange={handleChange} />

      <label>Savings: </label>
      <input type="number" name="savingsPct" onChange={handleChange} />

      <button type="submit" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}

export default BudgetPage;
