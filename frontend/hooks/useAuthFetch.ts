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
 */

"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { API_BASE } from "@/lib/api";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export function useAuthFetch() {
  const { data: session } = useSession();

  return useCallback(
    (path: string, options: FetchOptions = {}): Promise<Response> => {
      // @ts-expect-error — accessToken added in auth.ts callbacks
      const token: string | undefined = session?.accessToken;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      return fetch(`${API_BASE}${path}`, { ...options, headers });
    },
    [session]
  );
}
