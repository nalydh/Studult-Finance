/*
BudgetForm Component:
  Renders a form to input weekly income and handles submission.
*/

import React from "react";
import InputField from "../../../components/InputField";
import { InputFieldProps } from "../../../components/InputField";

function BudgetForm({ income, handleSubmit, handleChange }) {
  const formFields: InputFieldProps[] = [
    {
      label: "Weekly Income",
      name: "income",
      value: income,
      prefix: "$",
      handleChange: handleChange,
    },
  ];

  return (
    <div className="bg-white rounded p-6 pb-11 shadow border max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          Weekly Budget Planner
        </h2>
        {formFields.map(({ label, name, value, prefix, suffix, handleChange }) => {
          return (
            <div key={name}>
              <InputField
                label={label}
                name={name}
                value={value}
                prefix={prefix}
                suffix={suffix}
                handleChange={handleChange}
              />
            </div>
          );
        })}

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
