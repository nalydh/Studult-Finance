"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { API_BASE } from "@/lib/api";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No unsubscribe token provided.");
      return;
    }

    fetch(`${API_BASE}/auth/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to unsubscribe. Link may be invalid or expired.");
        }
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.message);
      });
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <h2 className="text-xl font-semibold text-zinc-900">Unsubscribing...</h2>
            <p className="text-zinc-500 text-sm">Please wait while we process your request.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Successfully Unsubscribed</h2>
            <p className="text-zinc-500 text-sm">
              You will no longer receive weekly check-in reminders. You can re-enable them later from your account settings if you change your mind.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Unsubscribe Failed</h2>
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-12">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
