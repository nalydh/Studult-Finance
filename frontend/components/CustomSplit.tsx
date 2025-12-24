/*
Custom Split Component:
  Allows users to input custom percentage splits for needs, wants, and savings.
*/

import React, { ChangeEvent, useEffect, useRef } from "react";
import InputField, { InputFieldProps } from "./InputField";
import { BudgetForm } from "@/app/welcome/page";
import { CheckCircle2, AlertCircle, InfoIcon } from "lucide-react";

interface CustomSplitProps {
  form: BudgetForm;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
}

function CustomSplit({ form, handleChange, isDisabled }: CustomSplitProps) {
  const formFields: Omit<InputFieldProps, "handleChange" | "isDisabled">[] = [
    {
      label: "Needs",
      name: "needsPct",
      value: form.needsPct,
      suffix: "%",
    },
    {
      label: "Wants",
      name: "wantsPct",
      value: form.wantsPct,
      suffix: "%",
    },
    {
      label: "Savings",
      name: "savingsPct",
      value: form.savingsPct,
      suffix: "%",
    },
  ];

  const customSplitRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const total =
    Number(form.needsPct || 0) +
    Number(form.wantsPct || 0) +
    Number(form.savingsPct || 0);
  const isValid = Math.abs(total - 100) < 0.01 && total > 0;
  const isOver = total > 100;
  const remaining = 100 - total;

  useEffect(() => {
    if (!isDisabled) {
      firstInputRef.current?.focus();
    }
  }, [isDisabled]);

  return (
    <div
      className={`bg-white p-6 w-full rounded cursor-pointer transition-all ${
        isDisabled ? "bg-gray-50" : ""
      }`}
    >
      <h2 className="text-xl font-bold text-foreground text-center">
        Custom Strategy
      </h2>
      <p className="text-sm text-gray-500 mb-4 text-center">
        Create a strategy suited to your goals.
      </p>
      <div
        className="flex flex-row gap-4 items-end flex-wrap justify-center"
        ref={customSplitRef}
      >
        {formFields.map(({ label, name, value, prefix, suffix }, index) => (
          <div key={name}>
            <InputField
              inputRef={index === 0 ? firstInputRef : undefined}
              label={label}
              name={name}
              value={value}
              prefix={prefix}
              suffix={suffix}
              handleChange={handleChange}
              isDisabled={isDisabled}
              className="focus-within:ring-primary-light"
              maxLength={5}
            />
          </div>
        ))}
        <div className="flex flex-row items-center gap-2">
        <InfoIcon className="w-3 h-3 text-gray-500"/>
        <p className="text-sm text-gray-500 text-center">
          Ensure the total equals 100% and each category is greater than 0%.
        </p>
        </div>
      </div>
    </div>
  );
}

export default CustomSplit;
