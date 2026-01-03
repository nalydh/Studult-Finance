/*
Custom Split Component:
  Allows users to input custom percentage splits for needs, wants, and savings.
*/

import React, { ChangeEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BudgetForm } from "@/app/welcome/page";
import { InfoIcon } from "lucide-react";

interface CustomSplitProps {
  form: BudgetForm;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
}

function CustomSplit({ form, handleChange, isDisabled }: CustomSplitProps) {
  const formFields = [
    {
      label: "Needs",
      name: "needsPct",
      value: form.needsPct,
    },
    {
      label: "Wants",
      name: "wantsPct",
      value: form.wantsPct,
    },
    {
      label: "Savings",
      name: "savingsPct",
      value: form.savingsPct,
    },
  ];

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDisabled) {
      firstInputRef.current?.focus();
    }
  }, [isDisabled]);

  return (
    <Card className={`w-full transition-all ${isDisabled ? "bg-gray-50" : ""}`}>
      <CardHeader>
        <CardTitle className="text-center">Custom Strategy</CardTitle>
        <CardDescription className="text-center">
          Create a strategy suited to your goals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-4 items-end flex-wrap justify-center">
          {formFields.map(({ label, name, value }, index) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                ref={index === 0 ? firstInputRef : undefined}
                type="text"
                inputMode="decimal"
                name={name}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                maxLength={5}
                suffix="%"
                className="w-28 focus-visible:ring-primary-light"
                pattern="[0-9]*\.?[0-9]*"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center gap-2 mt-4 justify-center">
          <InfoIcon className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Ensure the total equals 100% and each category is greater than 0%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default CustomSplit;
