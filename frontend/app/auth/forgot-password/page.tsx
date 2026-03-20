"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Mail } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
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
            No worries —<br />
            <span className="text-emerald-400">it happens.</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <p className="relative z-10 text-xs text-zinc-700">Manual first. Always.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="absolute top-6 left-6">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to sign in
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {submitted ? (
            /* ── Success state ── */
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h2 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-zinc-900">
                Check your inbox
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link
                within a few minutes. The link expires in <strong>1 hour</strong>.
              </p>
              <p className="text-xs text-zinc-400">
                Didn&apos;t get it? Check your spam folder or{" "}
                <button
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  try a different email
                </button>
                .
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <h2 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-zinc-900">
                  Forgot your password?
                </h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form id="forgot-password-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                  />
                </div>

                <button
                  id="forgot-submit-button"
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 group mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-500">
                Remember it?{" "}
                <Link href="/auth/signin" className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
