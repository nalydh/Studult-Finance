"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  onSplitUpdated?: () => void;
}

export function BudgetSettings({ currentSplit, onSplitUpdated }: BudgetSettingsProps) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [weekStartDay, setWeekStartDay] = useState("monday");
  const [incomeType, setIncomeType] = useState("salary");
  const [error, setError] = useState("");
  
  // Form state for SplitSelector component
  const [form, setForm] = useState({
    needsPct: currentSplit.needs.toString(),
    wantsPct: currentSplit.wants.toString(),
    savingsPct: currentSplit.savings.toString(),
  });

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        needsPct: currentSplit.needs.toString(),
        wantsPct: currentSplit.wants.toString(),
        savingsPct: currentSplit.savings.toString(),
      });
      
      // Check if current split matches a preset
      const matchingPreset = SPLIT_OPTIONS.find(
        option => option.value.needs === currentSplit.needs && 
                  option.value.wants === currentSplit.wants && 
                  option.value.savings === currentSplit.savings
      );
      
      setSelectedPreset(matchingPreset ? matchingPreset.id : CUSTOM_SPLIT_ID);
    }
  }, [open, currentSplit]);

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
  const isValid = total === 100 && needs > 0 && wants > 0 && savings > 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!isValid) {
      setError("Percentages must add up to 100% and all must be greater than 0");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/budget/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          needs_pct: needs,
          wants_pct: wants,
          savings_pct: savings,
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
        <Button variant="outline">
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
              handleSubmit={(e) => e.preventDefault()} // Prevent default, we handle submit below
            />
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* General Preferences Section */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
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
