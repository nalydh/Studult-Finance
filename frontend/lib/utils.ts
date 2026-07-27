import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a dollar amount with exactly two decimals and thousands
 * separators, e.g. 379.8 → "379.80", 12345.678 → "12,345.68".
 * Use for every user-facing currency figure so formatting stays consistent.
 *
 * Missing/non-numeric input formats as "0.00" rather than throwing — a single
 * absent value (a dialog mounted before its record loads, say) must never take
 * down the page. Guard at the call site when "no value" should read as "—".
 */
export function money(n: number | null | undefined): string {
  const value = typeof n === "number" && Number.isFinite(n) ? n : 0
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
