"use client";

import { CheckCircle2, XCircle } from "lucide-react";

/* ── Password policy — keep in sync with backend _validate_password ── */
export const PASSWORD_CHECKS = [
  { label: "8+ characters",    test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number",           test: (p: string) => /[0-9]/.test(p) },
];

export function passwordValid(password: string): boolean {
  return PASSWORD_CHECKS.every((c) => c.test(password));
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = PASSWORD_CHECKS.map((c) => ({ label: c.label, pass: c.test(password) }));
  const passed = checks.filter((c) => c.pass).length;
  const strengthColor =
    passed === 0 ? "bg-zinc-200"
    : passed === 1 ? "bg-red-400"
    : passed === 2 ? "bg-amber-400"
    : "bg-emerald-500";

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < passed ? strengthColor : "bg-zinc-200"
            }`}
          />
        ))}
      </div>
      {/* Checks */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(({ label, pass }) => (
          <span
            key={label}
            className={`flex items-center gap-1 text-xs transition-colors ${
              pass ? "text-emerald-600" : "text-red-400"
            }`}
          >
            {pass
              ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              : <XCircle className="h-3 w-3 text-red-400" />}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
