/*
BudgetForm Component:
  Renders a form to input weekly income and handles submission.
*/

import React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PiggyBankIcon, ReceiptIcon, WalletMinimalIcon } from "lucide-react";

function BudgetForm({ income, handleSubmit, handleChange }) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Weekly Budget Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Weekly Income
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={income}
              onChange={handleChange}
              prefix="$"
              placeholder="0.00"
              pattern="[0-9]*\.?[0-9]*"
              className="focus-visible:ring-primary-light"
            />
          </div>
          <div >
          <button
            type="submit"
            className="w-full bg-primary-dark hover:bg-primary-light text-white py-2 px-4 rounded transition"
          >
            Submit
          </button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default BudgetForm;
