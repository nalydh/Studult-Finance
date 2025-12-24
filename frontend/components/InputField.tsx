/*
InputField Component (CUSTOM):
  A reusable input field component with optional prefix/suffix icon.
*/

import React from "react";

export interface InputFieldProps {
  label: string;
  name: string;
  value: string | number;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
  isDisabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
  maxLength?: number;
}

function InputField({
  label,
  name,
  value,
  handleChange,
  prefix,
  suffix,
  isDisabled,
  inputRef,
  className,
  maxLength,
}: InputFieldProps) {
  return (
    <div>
      <label className="font-medium text-gray-700">{label}:</label>
      <div
        className={`flex items-center border rounded px-3 py-2 focus-within:ring-2 ${className ? className : "focus-within:ring-primary"} ${
          isDisabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      >
        {prefix && <span className="text-gray-500">{prefix}</span>}
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleChange}
          disabled={isDisabled}
          maxLength={maxLength}
          className="ml-2 flex-1 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {suffix && <span className="text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

InputField.displayName = "InputField";

export default InputField;
