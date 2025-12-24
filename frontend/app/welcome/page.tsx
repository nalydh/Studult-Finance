/*
Budget Page:
  Allows users to select or customize their budget split strategy.
  Offers presets and a custom option, and submits the selected strategy.
*/

"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import SplitSelector from "../../components/SplitSelector";
import { SPLIT_OPTIONS } from "../../components/StrategyPresets";
import { CUSTOM_SPLIT_ID } from "../../components/StrategyPresets";

export interface BudgetForm {
  needsPct: string;
  wantsPct: string;
  savingsPct: string;
}

interface BudgetPayload {
  strategy_name: string;
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
}

function BudgetPage() {
  const [form, setForm] = useState<BudgetForm>({
    needsPct: "",
    wantsPct: "",
    savingsPct: "",
  });

  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(option: { id?: number }) {
    if (option.id !== undefined) {
      setSelected(option.id);
    }
    else {
      // If "Custom" is selected, set selected to CUSTOM_SPLIT_ID
      setSelected(CUSTOM_SPLIT_ID);
    }
    console.log("Selected strategy:", option.id !== undefined ? option.id : "Custom");
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // Organises payload to send to backend based on selected strategy
  function structurePayload(selected: number | null) {
    let payload: BudgetPayload;
    // If custom strategy is selected
    if (selected === CUSTOM_SPLIT_ID) {
      payload = {
        strategy_name: "Custom",
        needs_pct: Number(form.needsPct),
        wants_pct: Number(form.wantsPct),
        savings_pct: Number(form.savingsPct),
      }
    }
    // If a preset strategy is selected
    else {
      const selectedPreset = SPLIT_OPTIONS.find(
        (option) => option.id === selected
      );
      if (!selectedPreset) {
        throw new Error(`No preset found for id ${selected}`);
      }
      payload = {
        strategy_name: selectedPreset.label,
        needs_pct: selectedPreset.value.needs,
        wants_pct: selectedPreset.value.wants,
        savings_pct: selectedPreset.value.savings,
      };
    }
    return payload;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = structurePayload(selected);

    try {
      const response = await fetch("http://localhost:8000/budget/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Received split:", data);
    } catch (error) {
      console.error("POST ERROR:", error);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <SplitSelector
            form={form}
            selected={selected}
            setSelected={setSelected}
            handleSelect={handleSelect}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
export default BudgetPage;
