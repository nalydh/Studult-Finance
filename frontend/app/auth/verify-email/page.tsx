"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const requested = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }

    // React StrictMode mounts effects twice in dev; without this guard the
    // second request hits an already-used token and reports a false failure.
    if (requested.current) return;
    requested.current = true;

    async function verify() {
      try {
        const res = await fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center space-y-6">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center justify-center mb-2">
          <span className="font-[family-name:var(--font-poppins)] text-xl font-bold tracking-[0.25em]">
            <span className="text-zinc-800">STU</span>
            <span className="text-emerald-500">FIN</span>
          </span>
        </Link>

        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-zinc-300 mx-auto" />
            <p className="text-sm text-zinc-500">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Email verified!</h1>
            <p className="text-sm text-zinc-500">Your email has been confirmed. You can now sign in to your account.</p>
            <Link
              href="/auth/signin?verified=1"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 text-sm font-semibold transition-all"
            >
              Sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Verification failed</h1>
            <p className="text-sm text-zinc-500">{message}</p>
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 text-sm font-semibold transition-all"
              >
                Back to sign in
              </Link>
              <p className="text-xs text-zinc-400">
                Need a new link? Enter your email on the{" "}
                <Link href="/auth/signin?registered=1" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  sign in page
                </Link>
                {" "}to request another.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
