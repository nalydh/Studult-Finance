/**
 * useAuthFetch — a hook that returns a fetch wrapper pre-loaded with the
 * current session's Bearer token.
 *
 * Usage in any client component:
 *
 *   const authFetch = useAuthFetch();
 *
 *   useEffect(() => {
 *     authFetch("/accounts/").then(r => r.json()).then(setAccounts);
 *   }, [authFetch]);
 *
 * The returned function has the same signature as the native `fetch`,
 * except the path is relative to API_BASE (e.g. "/accounts/" not the full URL).
 *
 * If the session has expired (or the backend answers 401), the user is
 * signed out and sent back to the sign-in page.
 */

"use client";

import { getSession, signOut, useSession } from "next-auth/react";
import { useCallback } from "react";
import { API_BASE } from "@/lib/api";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

let redirectingToSignIn = false;

async function forceSignIn(): Promise<never> {
  if (!redirectingToSignIn) {
    redirectingToSignIn = true;
    await signOut({ redirect: false });
    window.location.href = "/auth/signin?expired=1";
  }
  throw new Error("Session expired");
}

export function useAuthFetch() {
  const { data: session, status } = useSession();

  const getToken = useCallback(async () => {
    if (status === "loading") {
      const freshSession = await getSession();
      if (freshSession?.error) return undefined;
      return freshSession?.accessToken;
    }

    if (session?.error) return undefined;
    return session?.accessToken;
  }, [session, status]);

  return useCallback(
    async (path: string, options: FetchOptions = {}): Promise<Response> => {
      const token = await getToken();

      if (!token) {
        if (status === "unauthenticated" || session?.error) {
          return forceSignIn();
        }
        throw new Error("Not authenticated");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

      // The backend no longer recognises our token — session is dead.
      if (res.status === 401) {
        return forceSignIn();
      }

      return res;
    },
    [getToken, status, session]
  );
}
