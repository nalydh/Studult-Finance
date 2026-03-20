"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset link. Please request a new one.");
  }, [token]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const canSubmit = token && password.length >= 8 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "Something went wrong. Please request a new reset link.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/auth/signin?reset=1"), 2500);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-[25%] left-[20%] h-[500px] w-[500px] rounded-full bg-emerald-900/20 blur-[100px]" />
        </div>
        <Link href="/" className="relative z-10 inline-flex items-center w-fit">
          <span className="font-[family-name:var(--font-poppins)] text-xl font-bold tracking-[0.25em]">
            <span className="text-zinc-300">STU</span>
            <span className="text-emerald-500">FIN</span>
          </span>
        </Link>
        <div className="relative z-10 space-y-4">
          <h1 className="font-[family-name:var(--font-inter)] text-4xl font-bold leading-tight text-white">
            Reset your<br />
            <span className="text-emerald-400">password.</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            Choose a strong password with at least 8 characters.
          </p>
        </div>
        <p className="relative z-10 text-xs text-zinc-700">Manual first. Always.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-sm">

          {success ? (
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Password updated!</h2>
              <p className="text-sm text-zinc-500">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-zinc-900">
                  Set a new password
                </h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Must be at least 8 characters.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label htmlFor="reset-password" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all ${
                        tooShort
                          ? "border-red-300 focus:ring-red-400/30"
                          : "border-zinc-200 focus:ring-emerald-500/40 focus:border-emerald-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {tooShort && <p className="mt-1 text-xs text-red-500">Must be at least 8 characters</p>}
                </div>

                {/* Confirm */}
                <div>
                  <label htmlFor="reset-confirm" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="reset-confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={128}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all ${
                      mismatch
                        ? "border-red-300 focus:ring-red-400/30"
                        : "border-zinc-200 focus:ring-emerald-500/40 focus:border-emerald-400"
                    }`}
                  />
                  {mismatch && <p className="mt-1 text-xs text-red-500">Passwords don&apos;t match</p>}
                </div>

                <button
                  id="reset-submit-button"
                  type="submit"
                  disabled={isLoading || !canSubmit}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 group mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Update password
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-500">
                <Link href="/auth/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                  Request a new reset link
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
