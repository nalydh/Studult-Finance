"use client";

import React, { useState, ChangeEvent } from "react";
import SplitSelector from "./components/SplitSelector";
import { SPLIT_OPTIONS } from "../../components/StrategyPresets";
import { CUSTOM_SPLIT_ID } from "../../components/StrategyPresets";
import { useRouter } from "next/navigation";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { Loader2, ArrowRight, ArrowLeft, Briefcase, Calendar, HandCoins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface BudgetForm {
  needsPct: string;
  wantsPct: string;
  savingsPct: string;
}

export default function WelcomePage() {
  const router = useRouter();
  const authFetch = useAuthFetch();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Step 1: Budget Split
  const [form, setForm] = useState<BudgetForm>({
    needsPct: "",
    wantsPct: "",
    savingsPct: "",
  });
  const [selected, setSelected] = useState<number | null>(null);

  // Step 2 & 3: Income & Preferences
  const [incomeType, setIncomeType] = useState("Salary");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryFrequency, setSalaryFrequency] = useState("Monthly");
  const [weekStartsOn, setWeekStartsOn] = useState("Monday");

  function handleSelect(option: { id?: number }) {
    if (option.id !== undefined) {
      setSelected(option.id);
    } else {
      setSelected(CUSTOM_SPLIT_ID);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  const isStep1Valid = () => {
    if (selected === null) return false;
    if (selected === CUSTOM_SPLIT_ID) {
      const n = Number(form.needsPct);
      const w = Number(form.wantsPct);
      const s = Number(form.savingsPct);
      return n > 0 && w > 0 && s > 0 && n + w + s === 100;
    }
    return true;
  };

  const isStep2Valid = () => {
    if (incomeType === "Casual") return true; 
    return Number(salaryAmount) > 0;
  };

  async function handleSubmit() {
    setIsSubmitting(true);
    setApiError(null);

    let strategy_name = "Custom";
    let needs_pct = Number(form.needsPct);
    let wants_pct = Number(form.wantsPct);
    let savings_pct = Number(form.savingsPct);

    if (selected !== CUSTOM_SPLIT_ID) {
      const preset = SPLIT_OPTIONS.find((o) => o.id === selected);
      if (preset) {
        strategy_name = preset.label;
        needs_pct = preset.value.needs;
        wants_pct = preset.value.wants;
        savings_pct = preset.value.savings;
      }
    }

    const payload = {
      strategy_name,
      needs_pct,
      wants_pct,
      savings_pct,
      income_type: incomeType,
      salary_amount: Number(salaryAmount) || 0,
      salary_frequency: salaryFrequency,
      week_starts_on: weekStartsOn,
      tutorial_completed: false, // ensures they see the flow on dashboard
    };

    try {
      const response = await authFetch("/budget/preferences", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || `Backend returned error ${response.status}`;
        setApiError(errorMessage);
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("POST ERROR:", error);
      setApiError("A network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]">
        {/* Left Sidebar */}
        <div className="bg-emerald-600 text-white p-8 md:w-1/3 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
            <p className="text-emerald-100 mb-8">
              Let's get your Studult Finance account set up. This will only take a minute.
            </p>
            
            <div className="space-y-6">
              <div className={`flex items-center gap-3 transition-opacity ${step >= 1 ? "opacity-100" : "opacity-50"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? "bg-white text-emerald-600" : "bg-emerald-500 text-white"}`}>1</div>
                <span className={step === 1 ? "font-semibold" : ""}>Strategy</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity ${step >= 2 ? "opacity-100" : "opacity-50"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? "bg-white text-emerald-600" : step > 2 ? "bg-emerald-500 text-white" : "bg-emerald-800 text-emerald-300"}`}>2</div>
                <span className={step === 2 ? "font-semibold" : ""}>Income Setup</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity ${step >= 3 ? "opacity-100" : "opacity-50"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 3 ? "bg-white text-emerald-600" : step > 3 ? "bg-emerald-500 text-white" : "bg-emerald-800 text-emerald-300"}`}>3</div>
                <span className={step === 3 ? "font-semibold" : ""}>Preferences</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-sm text-emerald-200">
            You can always change these settings later from your dashboard.
          </div>
        </div>

        {/* Right Content */}
        <div className="p-8 md:w-2/3 flex flex-col justify-between overflow-y-auto">
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {step === 1 && (
              <div className="space-y-6">
                <SplitSelector
                  form={form}
                  selected={selected}
                  setSelected={setSelected}
                  handleSelect={handleSelect}
                  handleChange={handleChange}
                  handleSubmit={(e: any) => e.preventDefault()}
                  hideSubmit={true}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Income Details</h2>
                  <p className="text-slate-600">Tell us how you get paid so we can automate your reporting appropriately.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">Income Type</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${incomeType === 'Salary' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="w-5 h-5" />
                          <span className="font-semibold">Salary</span>
                        </div>
                        <p className="text-xs text-slate-500">Consistent paycheck</p>
                        <input type="radio" name="incomeType" value="Salary" className="hidden" checked={incomeType === "Salary"} onChange={(e) => setIncomeType(e.target.value)} />
                      </label>
                      <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${incomeType === 'Casual' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}>
                         <div className="flex items-center gap-2 mb-1">
                          <HandCoins className="w-5 h-5" />
                          <span className="font-semibold">Casual</span>
                        </div>
                        <p className="text-xs text-slate-500">Variable paycheck</p>
                        <input type="radio" name="incomeType" value="Casual" className="hidden" checked={incomeType === "Casual"} onChange={(e) => setIncomeType(e.target.value)} />
                      </label>
                    </div>
                  </div>

                  {incomeType === "Salary" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Salary Amount</label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={salaryAmount} 
                          onChange={(e) => setSalaryAmount(e.target.value)} 
                          className="text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Payment Frequency</label>
                        <select 
                          className="w-full border border-slate-200 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                          value={salaryFrequency}
                          onChange={(e) => setSalaryFrequency(e.target.value)}
                        >
                          <option value="Weekly">Weekly</option>
                          <option value="Fortnightly">Fortnightly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                 <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Final Preferences</h2>
                  <p className="text-slate-600">When do you want your weekly budget cycle to reset?</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">Week Starts On</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 border rounded-lg p-5 cursor-pointer transition-all ${weekStartsOn === 'Monday' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-2 mb-1 justify-center">
                          <Calendar className="w-5 h-5" />
                          <span className="font-semibold text-lg">Monday</span>
                        </div>
                        <input type="radio" name="weekStartsOn" value="Monday" className="hidden" checked={weekStartsOn === "Monday"} onChange={(e) => setWeekStartsOn(e.target.value)} />
                      </label>
                      <label className={`flex-1 border rounded-lg p-5 cursor-pointer transition-all ${weekStartsOn === 'Sunday' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}>
                         <div className="flex items-center gap-2 mb-1 justify-center">
                          <Calendar className="w-5 h-5" />
                          <span className="font-semibold text-lg">Sunday</span>
                        </div>
                        <input type="radio" name="weekStartsOn" value="Sunday" className="hidden" checked={weekStartsOn === "Sunday"} onChange={(e) => setWeekStartsOn(e.target.value)} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {apiError && (
              <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                <span className="font-semibold">Error:</span> {apiError}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={(step === 1 && !isStep1Valid()) || (step === 2 && !isStep2Valid())}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
