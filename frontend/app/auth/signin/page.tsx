"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

/* ── Google SVG Icon ── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "1") {
        setSuccess("Account created! Please check your email to verify your account before signing in.");
      } else if (params.get("verified") === "1") {
        setSuccess("Email verified! You can now sign in to your account.");
      } else if (params.get("expired") === "1") {
        setError("Your session has expired. Please sign in again.");
      }
    }
  }, []);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUnverifiedEmail(null);
    setIsLoading(true);

    try {
      // Pre-flight check to gracefully handle unverified users
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.detail === "Please verify your email address to log in.") {
           setUnverifiedEmail(email);
           setError(data.detail);
           setIsLoading(false);
           return;
        }
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Credentials are good and user is verified. Proceed with NextAuth.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        window.location.href = "/welcome";
      }
    } catch {
       setError("Something went wrong. Please check your connection and try again.");
    } finally {
       setIsLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || !unverifiedEmail) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Something went wrong. Please try again.");
        return;
      }

      setSuccess("A new verification link has been sent to your email.");
      setCountdown(30);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    // On the sign-in page, there is no checkbox, so we don't opt them in by default here
    // unless we wanted to. We'll pass false or let it default.
    document.cookie = `marketing_consent=false; path=/; max-age=3600; samesite=lax`;
    await signIn("google", { callbackUrl: "/welcome" });
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ─── Left panel — brand ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden">

        {/* Background glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-[25%] left-[20%] h-[500px] w-[500px] rounded-full bg-emerald-900/20 blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-emerald-800/10 blur-[80px]" />
        </div>

        {/* Logo — text only */}
        <Link href="/" className="relative z-10 inline-flex items-center group w-fit">
          <span className="font-[family-name:var(--font-poppins)] text-xl font-bold tracking-[0.25em]">
            <span className="text-zinc-300">STU</span>
            <span className="text-emerald-500">FIN</span>
          </span>
        </Link>

        {/* Centre copy */}
        <div className="relative z-10 space-y-6">
          <h1 className="font-[family-name:var(--font-inter)] text-4xl font-bold leading-tight text-white">
            Your finances,<br />
            <span className="text-emerald-400">finally clear.</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            StuFin is your weekly and monthly ritual to track net worth,
            manage budgets, and build real wealth — intentionally.
          </p>

          {/* 3 pillars */}
          <div className="space-y-3 pt-2">
            {[
              "Track net worth across all account types",
              "Split your budgets with your own custom rules",
              "Monitor your physical assets, investments & more",
            ].map((point) => (
              <div key={point} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-sm text-zinc-400">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-xs text-zinc-700">
          Manual first. Always.
        </p>
      </div>

      {/* ─── Right panel — form ──────────────────────────────── */}
      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 bg-white">

        {/* Back to home — desktop, top-left of white panel */}
        <div className="absolute top-6 left-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>
        </div>

        {/* Back to home — top-left corner */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-zinc-900">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Sign in to your StuFin account.
            </p>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <p>{error}</p>
              {unverifiedEmail && (
                 <button
                   type="button"
                   onClick={handleResend}
                   disabled={countdown > 0 || isLoading}
                   className="mt-2 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50 transition-colors underline"
                 >
                   {countdown > 0 ? `Resend email in ${countdown}s` : "Resend verification email"}
                 </button>
              )}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-zinc-400 uppercase tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Password
                </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 group mt-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
