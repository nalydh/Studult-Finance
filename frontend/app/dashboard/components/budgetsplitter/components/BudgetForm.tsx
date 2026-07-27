/*
BudgetForm Component:
  Renders a form to input weekly income and handles submission.
  TODO: Add ? icon to explain how weekly income is used.
*/

import React, { FormEvent, ChangeEvent, useState, useEffect } from "react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { money } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PiggyBankIcon, TrendingUp, Wallet, Settings2, Lock, Loader2 } from "lucide-react";
import { BreakdownSheet } from "./BreakdownSheet";
import { BudgetSettings } from "./BudgetSettings";
import { MilestoneModal } from "./MilestoneModal";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SplitData {
  needs: number;
  wants: number;
  savings: number;
}

export interface BudgetItem {
  id: string | number;
  name: string;
  amount: number;
  category: "Needs" | "Wants" | "Savings";
  frequency?: "weekly" | "monthly" | "annually";
}

function toWeeklyAmount(amount: number, frequency: BudgetItem["frequency"]) {
  if (frequency === "monthly") return (amount * 12) / 52;
  if (frequency === "annually") return amount / 52;
  return amount;
}

function frequencyLabel(frequency: BudgetItem["frequency"]) {
  if (frequency === "monthly") return "month";
  if (frequency === "annually") return "year";
  return "week";
}

function BudgetForm({ onReady }: { onReady?: () => void }) {
  const authFetch = useAuthFetch();
  const [income, setIncome] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [splitData, setSplitData] = useState<SplitData>({
    needs: 0,
    wants: 0,
    savings: 0,
  });
  const [weekStartsOn, setWeekStartsOn] = useState("Monday");
  const [incomeType, setIncomeType] = useState("Salary");
  const [salaryAmount, setSalaryAmount] = useState<number | null>(null);
  const [salaryFrequency, setSalaryFrequency] = useState<string | null>(null);
  const [splitAmounts, setSplitAmounts] = useState<SplitData>({
    needs: 0,
    wants: 0,
    savings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState<number | null>(null);

  // Fetch user's split preferences on mount and budget items
  useEffect(() => {
    async function fetchSplit() {
      try {
        const splitResult = await authFetch("/budget/preferences");
        const splitData = await splitResult.json();

        setSplitData({
          needs: splitData?.needs_pct ?? 0,
          wants: splitData?.wants_pct ?? 0,
          savings: splitData?.savings_pct ?? 0,
        });
        if (splitData.week_starts_on) setWeekStartsOn(splitData.week_starts_on);
        if (splitData.income_type) setIncomeType(splitData.income_type);
        if (splitData.salary_amount) setSalaryAmount(splitData.salary_amount);
        if (splitData.salary_frequency) setSalaryFrequency(splitData.salary_frequency);

        const itemsResult = await authFetch("/budget/items");
        const itemsData = await itemsResult.json();
        setBudgetItems(Array.isArray(itemsData) ? itemsData : []);

        // Check if a split already exists this week
        const weekResult = await authFetch("/budget/current-week-split");
        const weekData = await weekResult.json();
        
        let hasSubmission = false;
        if (weekData && weekData.id) {
          setIsLockedOut(true);
          hasSubmission = true;
          setIncome((weekData?.amount ?? 0).toString());
          setSplitAmounts({
            needs: weekData.needs_allocated,
            wants: weekData.wants_allocated,
            savings: weekData.savings_allocated,
          });
        }

        if (!hasSubmission && splitData.expected_weekly_income) {
          setIncome(Number(splitData.expected_weekly_income).toFixed(2));
        }
      } catch (error) {
        console.error("Error fetching split: ", error);
      } finally {
        setIsLoading(false);
        onReady?.();
      }
    }
    fetchSplit();
  }, [authFetch]);

  // Calculate splits in real-time as user types
  useEffect(() => {
    if (income && Number(income) > 0) {
      const incomeNum = Number(income);
      setSplitAmounts({
        needs: (incomeNum * splitData.needs) / 100,
        wants: (incomeNum * splitData.wants) / 100,
        savings: (incomeNum * splitData.savings) / 100,
      });
    } else {
      setSplitAmounts({
        needs: 0,
        wants: 0,
        savings: 0,
      });
    }
  }, [income, splitData]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setIncome(e.target.value);
  }

  async function refreshBudgetItems() {
    try {
      const itemsResult = await authFetch("/budget/items");
      const itemsData = await itemsResult.json();
      setBudgetItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (error) {
      console.error("Error refreshing budget items:", error);
    }
  }

  async function refreshSplitPreferences() {
    try {
      const splitResult = await authFetch("/budget/preferences");
      const splitData = await splitResult.json();
      setSplitData({
        needs: splitData?.needs_pct ?? 0,
        wants: splitData?.wants_pct ?? 0,
        savings: splitData?.savings_pct ?? 0,
      });
      if (splitData.week_starts_on) setWeekStartsOn(splitData.week_starts_on);
      if (splitData.income_type) setIncomeType(splitData.income_type);
      if (splitData.salary_amount) setSalaryAmount(splitData.salary_amount);
      if (splitData.salary_frequency) setSalaryFrequency(splitData.salary_frequency);

      if (!isLockedOut && splitData.expected_weekly_income) {
        const weeklyFormatted = Number(splitData.expected_weekly_income).toFixed(2);
        setIncome((prev) => prev !== weeklyFormatted ? weeklyFormatted : prev);
      }
    } catch (error) {
      console.error("Error refreshing split preferences:", error);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (!income || Number(income) <= 0) {
      setSubmitError("Please enter a valid amount.");
      return;
    }
    // Submitting locks the week in — ask for confirmation first.
    setConfirmOpen(true);
  }

  async function submitWeeklyBudget() {
    // Re-entry guard: the button is disabled while in flight, but state
    // updates are async — this stops a double-click firing two requests.
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await authFetch("/budget/calculate", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(income),
          source: "Salary",
          strategy_name: "",
          needs_allocated: 0,
          wants_allocated: 0,
          savings_allocated: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.detail || `Backend returned ${response.status}`;
        setSubmitError(message);
        toast.error("Weekly budget not submitted", { description: message });
        return;
      }

      const data = await response.json();

      setSplitAmounts({
        needs: data.income_event.needs_allocated,
        wants: data.income_event.wants_allocated,
        savings: data.income_event.savings_allocated,
      });

      toast.success("Weekly budget submitted", {
        description: `$${money(Number(income))} split — Needs $${money(data.income_event.needs_allocated)}, Wants $${money(data.income_event.wants_allocated)}, Savings $${money(data.income_event.savings_allocated)}`,
      });

      // Gamification Check
      const updatedStreak = data.streak;
      const milestones = [1, 7, 50, 100, 365, 1000, 2000, 3000, 4000, 5000];
      if (milestones.includes(updatedStreak)) {
        setMilestoneCelebration(updatedStreak);
      }

      setIsLockedOut(true);
    } catch (error) {
      console.error("POST ERROR:", error);
      setSubmitError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-lg text-muted">
        Loading your budget preferences...
      </div>
    );
  }
  // Get current week info (Monday-Sunday)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  const walletTypes = [
    {
      name: "Needs" as const,
      icon: <Wallet className="text-green-400" />,
      value: splitAmounts?.needs || 0,
      percent: splitData?.needs || 0,
      items: budgetItems ? budgetItems.filter((item) => item.category === "Needs") : [],
    },
    {
      name: "Wants" as const,
      icon: <PiggyBankIcon className="text-blue-600" />,
      value: splitAmounts?.wants || 0,
      percent: splitData?.wants || 0,
      items: budgetItems ? budgetItems.filter((item) => item.category === "Wants") : [],
    },
    {
      name: "Savings" as const,
      icon: <TrendingUp className="text-green-600" />,
      value: splitAmounts?.savings || 0,
      percent: splitData?.savings || 0,
      items: budgetItems ? budgetItems.filter((item) => item.category === "Savings") : [],
    },
  ];

  return (
    <>
    {milestoneCelebration !== null && (
      <MilestoneModal 
        streak={milestoneCelebration} 
        onClose={() => {
          setMilestoneCelebration(null);
          // Trigger a window events so the navbar refetches the global streak immediately
          window.dispatchEvent(new Event("streak-updated"));
        }} 
      />
    )}
    <form onSubmit={handleSubmit}>
      <Card id="tour-budget-splitter" style={{ scrollMarginTop: '80px' }} className={`w-full transition-all duration-300 ${!isLockedOut ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/10" : ""}`}>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            Weekly Budget Splitter
            {!isLockedOut && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-center text-gray-600 flex flex-col items-center gap-2">
            <span>Week of {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}</span>
            {!isLockedOut && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Awaiting your submission
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Weekly Net Income from Salary
            </label>
            <Input
              id="tour-income-input"
              type="text"
              inputMode="decimal"
              value={income}
              onChange={handleChange}
              prefix="$"
              placeholder="0.00"
              pattern="[0-9]*\.?[0-9]*"
              maxLength={10}
              className="focus-visible:ring-primary-light"
              disabled={isLockedOut}
            />
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
              <p className="font-bold">Wallets</p>
              <p className="text-right whitespace-nowrap text-muted-foreground font-code">
                {splitData?.needs || 0}% / {splitData?.wants || 0}% /{" "}
                {splitData?.savings || 0}%
              </p>
            </div>
            <div id="tour-budget-items" style={{ scrollMarginTop: '80px' }}>
              {walletTypes.map((wallet) => {
                // Calculate unallocated amount
                const totalItemized = wallet.items.reduce(
                  (acc, item) => acc + toWeeklyAmount(item.amount, item.frequency),
                  0
                );
                const unallocated = wallet.value - totalItemized;

                return (
                  <Accordion
                    key={wallet.name}
                    type="single"
                    collapsible
                    defaultValue={wallet.items.length > 0 ? wallet.name : undefined}
                  >
                    <AccordionItem value={wallet.name} className="border-none">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <AccordionTrigger className="flex-1 hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <div className="text-xl">{wallet.icon}</div>
                            <span className="font-medium">{wallet.name}</span>
                            <span className="mr-1 text-xs text-muted-foreground">
                              ({wallet.items.length})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <div className="font-code text-right min-w-[80px]">
                          ${wallet.value.toFixed(2)}
                        </div>
                      </div>

                      <AccordionContent>
                        <Card className="ml-8 mr-2 bg-gray-50">
                          <CardContent className="p-4 space-y-2 text-sm">
                            {wallet.items.length === 0 ? (
                              <p className="text-muted-foreground text-xs italic">No items yet</p>
                            ) : (
                              <>
                                {wallet.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start justify-between gap-3 text-muted-foreground"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate">{item.name}</p>
                                      <p className="text-[11px] text-muted-foreground/90">
                                        ${item.amount.toFixed(2)} / {frequencyLabel(item.frequency)}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="font-code text-foreground">
                                        ${toWeeklyAmount(item.amount, item.frequency).toFixed(2)}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">per week</p>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between pt-2 border-t font-semibold">
                                  <span>{unallocated < 0 ? "Over Budget" : "Remaining"}</span>
                                  <span
                                    className={`font-code ${
                                      unallocated < 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    ${unallocated.toFixed(2)}
                                  </span>
                                </div>
                              </>
                            )}
                            <BreakdownSheet
                              category={wallet.name}
                              totalAllocated={wallet.value}
                              items={wallet.items}
                              onItemAdded={refreshBudgetItems}
                              onItemDeleted={refreshBudgetItems}
                            >
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm" 
                                className="w-full mt-2 border-dashed text-primary hover:border-black hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <Settings2 className="w-3 h-3 mr-1" />
                                Manage
                              </Button>
                            </BreakdownSheet>
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
          </div>
              <hr/>
          {submitError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <div className="flex gap-3">
            <div id="tour-budget-settings" className="shrink-0">
            <BudgetSettings 
              currentSplit={splitData}
              currentWeekStartsOn={weekStartsOn}
              currentIncomeType={incomeType}
              currentSalaryAmount={salaryAmount}
              currentSalaryFrequency={salaryFrequency}
              onSplitUpdated={refreshSplitPreferences}
            />
            </div>
            <div className="flex-1">
            <Button
              id="tour-submit-button"
              type="submit"
              className="w-full bg-primary-dark hover:bg-primary-light"
              disabled={isLockedOut || isSubmitting}
            >
              {isLockedOut ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Already Submitted This Week
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit"
              )}
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>

    {/* Weekly submit confirmation */}
    <Dialog open={confirmOpen} onOpenChange={(open) => !isSubmitting && setConfirmOpen(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit weekly budget?</DialogTitle>
          <DialogDescription>
            You&apos;re about to split ${money(Number(income || 0))} for the week of{" "}
            {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM")}. You can only submit once per
            week.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setConfirmOpen(false)}
          >
            No, go back
          </Button>
          <Button
            type="button"
            className="bg-primary-dark hover:bg-primary-light"
            disabled={isSubmitting}
            onClick={submitWeeklyBudget}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              "Yes, submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default BudgetForm;
