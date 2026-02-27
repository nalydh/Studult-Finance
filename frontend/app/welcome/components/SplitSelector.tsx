/*
SplitSelector Component:
  Allows users to select a budgeting strategy from preset options
  or customize their own split percentages.
*/

import { PiggyBankIcon, WalletMinimalIcon, ReceiptIcon } from "lucide-react";
import React, { useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { Tooltip } from "react-tooltip";
import CustomSplit from "./CustomSplit";
import { SPLIT_OPTIONS } from "../../../components/StrategyPresets";
import { CUSTOM_SPLIT_ID } from "../../../components/StrategyPresets";
import { BudgetForm } from "@/app/welcome/page";

interface SplitSelectorProps {
  form: BudgetForm;
  selected: number | null;
  setSelected: (id: number | null) => void;
  handleSelect: (option: { id: number }) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function SplitSelector({
  form,
  selected,
  setSelected,
  handleSelect,
  handleChange,
  handleSubmit,
}: SplitSelectorProps) {
  const cardAreaRef = useRef(null);
  const submitButtonRef = useRef(null);

  const isCustomValid = 
    form.needsPct !== "" &&
    form.wantsPct !== "" &&
    form.savingsPct !== "" &&
    (Number(form.needsPct) + Number(form.wantsPct) + Number(form.savingsPct) === 100) &&
    (Number(form.needsPct) > 0) &&
    (Number(form.wantsPct) > 0) &&
    (Number(form.savingsPct) > 0);

  const submitDisabled =
    selected === null ||
    (selected === CUSTOM_SPLIT_ID && !isCustomValid);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedOutsideCard =
        cardAreaRef.current && !cardAreaRef.current.contains(event.target as Node);

      const clickedOutsideSubmitButton =
        submitButtonRef.current &&
        !submitButtonRef.current.contains(event.target as Node);

      if (clickedOutsideCard && clickedOutsideSubmitButton) {
        setSelected(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setSelected]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">
          Choose Your Strategy
        </h2>
        <div ref={cardAreaRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SPLIT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={`border rounded p-4 shadow transition 
              ${
                selected === option.id
                  ? "ring-2 ring-primary-light"
                  : "hover:ring-1 ring-gray-300"
              }`}
              >
                <h3 className="text-lg font-bold text-center">
                  {option.label}
                </h3>
                <p className="text-gray-600 text-sm text-center">
                  {option.description}
                </p>
                <div className="mt-2 text-sm font-mono text-center">
                  <p className="flex items-center justify-center gap-2 p-1">
                    <ReceiptIcon className="w-4 h-4" />
                    Needs:{" "}
                    <span className="font-bold">{option.value.needs}%</span>
                  </p>
                  <p className="flex items-center justify-center gap-2 p-1">
                    <WalletMinimalIcon className="w-4 h-4" /> Wants:{" "}
                    <span className="font-bold">{option.value.wants}%</span>
                  </p>
                  <p className="flex items-center justify-center gap-2 p-1">
                    <PiggyBankIcon className="w-4 h-4" /> Savings:{" "}
                    <span className="font-bold">{option.value.savings}%</span>
                  </p>
                  <div className="w-full h-4 mt-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div className="flex h-full w-full">
                      <div
                        className="h-full bg-danger"
                        data-tooltip-id="split-tooltip"
                        data-tooltip-content={`Needs: ${option.value.needs}%`}
                        style={{
                          width: `${option.value.needs}%`,
                          borderTopLeftRadius: "9999px",
                          borderBottomLeftRadius: "9999px",
                        }}
                      ></div>
                      <div
                        className="h-full bg-yellow-400"
                        data-tooltip-id="split-tooltip"
                        data-tooltip-content={`Wants: ${option.value.wants}%`}
                        style={{
                          width: `${option.value.wants}%`,
                        }}
                      ></div>
                      <div
                        className="h-full bg-primary-light"
                        data-tooltip-id="split-tooltip"
                        data-tooltip-content={`Savings: ${option.value.savings}%`}
                        style={{
                          width: `${option.value.savings}%`,
                          borderTopRightRadius: "9999px",
                          borderBottomRightRadius: "9999px",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

        {/* Custom Split Section */}
          <div
            className={`mt-4 transition rounded-xl shadow hover:shadow-lg ${
              selected === CUSTOM_SPLIT_ID
                ? "ring-2 ring-primary-light"
                : "hover:ring-1 ring-gray-300"
            }`}
            onClick={() => {
              handleSelect({ id: CUSTOM_SPLIT_ID });
            }}
          >
            <CustomSplit
              form={form}
              handleChange={handleChange}
              isDisabled={selected !== CUSTOM_SPLIT_ID}
            />
          </div>
        </div>
        <Tooltip id="split-tooltip" place="bottom" />

        {/* Submit Button */}
        <button
          type="submit"
          ref={submitButtonRef}
          disabled={submitDisabled}
          className={`bg-primary-dark mt-4 text-white font-semibold py-2 px-6 rounded hover:bg-primary-light transition block mx-auto ${
            submitDisabled ? "disabled cursor-not-allowed opacity-60" : ""
          }`}
        >
          Submit
        </button>
      </div>
    </form>
  );
}

export default SplitSelector;
