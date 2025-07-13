import React from "react";

function BudgetForm({ form, handleSubmit, handleChange }) {
  return (
    <div>
      <label>Weekly Income:</label>
      <input
        type="number"
        name="income"
        value={form.income}
        onChange={handleChange}
      />

      <h2>Calculate Split</h2>
      <label>Needs: </label>
      <input
        type="number"
        name="needsPct"
        value={form.needsPct}
        onChange={handleChange}
      />

      <label>Wants: </label>
      <input
        type="number"
        name="wantsPct"
        value={form.wantsPct}
        onChange={handleChange}
      />

      <label>Savings: </label>
      <input
        type="number"
        name="savingsPct"
        value={form.savingsPct}
        onChange={handleChange}
      />

      <button type="submit" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}

export default BudgetForm;
