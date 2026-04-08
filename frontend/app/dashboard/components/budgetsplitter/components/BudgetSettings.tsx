"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, InfoIcon } from "lucide-react";
import { SPLIT_OPTIONS, CUSTOM_SPLIT_ID } from "@/components/StrategyPresets";
import SplitSelector from "@/app/welcome/components/SplitSelector";

interface BudgetSettingsProps {
  currentSplit: {
    needs: number;
    wants: number;
    savings: number;
  };
  currentWeekStartsOn?: string;
  currentIncomeType?: string;
  currentSalaryAmount?: number | null;
  currentSalaryFrequency?: string | null;
  onSplitUpdated?: () => void;
}

export function BudgetSettings({ 
  currentSplit, 
  currentWeekStartsOn = "Monday", 
  currentIncomeType = "Salary", 
  currentSalaryAmount = null,
  currentSalaryFrequency = "monthly",
  onSplitUpdated 
}: BudgetSettingsProps) {
  const authFetch = useAuthFetch();
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [weekStartDay, setWeekStartDay] = useState(currentWeekStartsOn.toLowerCase());
  const [incomeType, setIncomeType] = useState(currentIncomeType.toLowerCase());
  const [salaryAmount, setSalaryAmount] = useState<string>(currentSalaryAmount ? currentSalaryAmount.toString() : "");
  const [salaryFrequency, setSalaryFrequency] = useState<string>(currentSalaryFrequency || "monthly");
  const [error, setError] = useState("");
  
  // Form state for SplitSelector component
  const [form, setForm] = useState({
    needsPct: (currentSplit?.needs ?? 0).toString(),
    wantsPct: (currentSplit?.wants ?? 0).toString(),
    savingsPct: (currentSplit?.savings ?? 0).toString(),
  });

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        needsPct: (currentSplit?.needs ?? 0).toString(),
        wantsPct: (currentSplit?.wants ?? 0).toString(),
        savingsPct: (currentSplit?.savings ?? 0).toString(),
      });
      setWeekStartDay(currentWeekStartsOn.toLowerCase());
      setIncomeType(currentIncomeType.toLowerCase());
      setSalaryAmount(currentSalaryAmount ? currentSalaryAmount.toString() : "");
      setSalaryFrequency(currentSalaryFrequency || "monthly");
      
      // Check if current split matches a preset
      const matchingPreset = SPLIT_OPTIONS.find(
        option => option.value.needs === currentSplit.needs && 
                  option.value.wants === currentSplit.wants && 
                  option.value.savings === currentSplit.savings
      );
      
      setSelectedPreset(matchingPreset ? matchingPreset.id : CUSTOM_SPLIT_ID);
    }
  }, [open, currentSplit, currentWeekStartsOn, currentIncomeType]);

  function handleSelect(option: { id: number }) {
    setSelectedPreset(option.id);
    const selectedOption = SPLIT_OPTIONS.find(opt => opt.id === option.id);
    if (selectedOption) {
      setForm({
        needsPct: selectedOption.value.needs.toString(),
        wantsPct: selectedOption.value.wants.toString(),
        savingsPct: selectedOption.value.savings.toString(),
      });
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // Calculate validation
  const needs = Number(form.needsPct) || 0;
  const wants = Number(form.wantsPct) || 0;
  const savings = Number(form.savingsPct) || 0;
  const total = needs + wants + savings;
  const isSplitValid = total === 100 && needs > 0 && wants > 0 && savings > 0;
  const isSalaryValid = incomeType !== "salary" || (Number(salaryAmount) > 0);
  const isValid = isSplitValid && isSalaryValid;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!isValid) {
      setError("Percentages must add up to 100% and all must be greater than 0");
      return;
    }
    
    if (incomeType === "salary") {
      if (!Number(salaryAmount) || Number(salaryAmount) <= 0) {
        setError("Please enter a valid salary amount");
        return;
      }
    }

    try {
      // Determine the strategy name to send
      let strategyName = "Custom";
      if (selectedPreset !== CUSTOM_SPLIT_ID) {
        const selectedOption = SPLIT_OPTIONS.find(opt => opt.id === selectedPreset);
        if (selectedOption) {
          strategyName = selectedOption.label;
        }
      }

      const response = await authFetch("/budget/preferences", {
        method: "PUT",
        body: JSON.stringify({
          strategy_name: strategyName,
          needs_pct: needs,
          wants_pct: wants,
          savings_pct: savings,
          week_starts_on: weekStartDay.charAt(0).toUpperCase() + weekStartDay.slice(1),
          income_type: incomeType.charAt(0).toUpperCase() + incomeType.slice(1),
          salary_amount: incomeType === "salary" ? Number(salaryAmount) : null,
          salary_frequency: incomeType === "salary" ? salaryFrequency : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      // Notify parent to refresh
      if (onSplitUpdated) {
        onSplitUpdated();
      }

      setOpen(false);
      setError("");
    } catch (err) {
      setError("Failed to save settings. Please try again.");
      console.error("Error updating split:", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Budget Settings</DialogTitle>
          <DialogDescription className="text-center">
            Choose a preset or customize your budget split
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          
          {/* Budget Split Section - Reusing SplitSelector */}
          <div>
            <SplitSelector
              form={form}
              selected={selectedPreset}
              setSelected={setSelectedPreset}
              handleSelect={handleSelect}
              handleChange={handleChange}
              handleSubmit={(e) => e.preventDefault()}
              hideSubmit
            />
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* General Preferences Section */}
          <div className="space-y-4 bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-sm uppercase tracking-wide">
              General Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekStart" className="text-sm font-medium">Week Starts On</Label>
                <Select value={weekStartDay} onValueChange={setWeekStartDay}>
                  <SelectTrigger id="weekStart" className="focus-visible:ring-primary-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incomeType" className="text-sm font-medium">Income Type</Label>
                <Select value={incomeType} onValueChange={setIncomeType}>
                  <SelectTrigger id="incomeType" className="focus-visible:ring-primary-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary (Auto-input)</SelectItem>
                    <SelectItem value="casual">Casual (Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {incomeType === "salary" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed">
                <div className="space-y-2">
                  <Label htmlFor="salaryAmount" className="text-sm font-medium">Salary Amount</Label>
                  <Input
                    id="salaryAmount"
                    type="text"
                    inputMode="decimal"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    placeholder="e.g. 60000"
                    className={(!salaryAmount || Number(salaryAmount) <= 0) ? "border-red-400 bg-red-50/50 focus-visible:ring-red-400" : ""}
                  />
                  {(!salaryAmount || Number(salaryAmount) <= 0) && (
                    <p className="text-[11px] text-red-600 font-medium tracking-tight">
                      * A salary amount is required
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryFrequency" className="text-sm font-medium">Frequency</Label>
                  <Select value={salaryFrequency} onValueChange={setSalaryFrequency}>
                    <SelectTrigger id="salaryFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white p-3 rounded border">
              <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                {incomeType === "salary" 
                  ? "Your weekly income will be automatically entered each week based on your salary."
                  : "You'll manually enter your income each week as it varies."}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
              <InfoIcon className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!isValid}
              className="bg-primary-dark hover:bg-primary-light disabled:opacity-50"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
