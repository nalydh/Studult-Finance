import React from "react";

function BudgetForm({ form, handleSubmit, handleChange }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-4 text-primary">
          Weekly Budget Planner
        </h2>
        <label className="font-medium text-gray-700">Weekly Income:</label>
        <input
          type="number"
          name="income"
          value={form.income}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <label className="font-medium text-gray-700">Needs: </label>
        <input
          type="number"
          name="needsPct"
          value={form.needsPct}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <label className="font-medium text-gray-700">Wants: </label>
        <input
          type="number"
          name="wantsPct"
          value={form.wantsPct}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <label className="font-medium text-gray-700">Savings: </label>
        <input
          type="number"
          name="savingsPct"
          value={form.savingsPct}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary-dark transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default BudgetForm;
