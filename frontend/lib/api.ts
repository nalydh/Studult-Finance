/**
 * Central API utility.
 *
 * All requests to the FastAPI backend go through `apiFetch`.
 * It automatically attaches the NextAuth session's accessToken as
 * an Authorization: Bearer header so every protected endpoint
 * receives the JWT it needs to identify the user.
 *
 * Usage (from a client component):
 *   const data = await apiFetch(session, "/accounts/")
 *
 * Usage (with options, e.g. POST):
 *   const data = await apiFetch(session, "/accounts/", {
 *     method: "POST",
 *     body: JSON.stringify({ name: "Savings", category: "Cash", balance: 1000, total_contributions: 0 }),
 *   })
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type AnySession = {
  accessToken?: string;
} | null;

export async function apiFetch(
  session: AnySession,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}