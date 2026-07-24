import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Refresh the backend access token once it has less than this long to live.
const REFRESH_WINDOW_MS = 30 * 60 * 1000;

/** Read the `exp` claim (as unix ms) off a JWT without verifying it. */
function tokenExpiryMs(jwt: string): number | undefined {
  try {
    const base64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          // Return shape expected by NextAuth: must include id
          return {
            id: String(data.id),
            email: data.email,
            name: data.name,
            accessToken: data.access_token,
            createdAt: data.created_at,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    maxAge: 2 * 60 * 60, // 2 hours in seconds
  },

  callbacks: {
    // For Google sign-ins, exchange the Google-signed ID token for a backend
    // session. If the backend rejects it (or is down), fail the sign-in
    // outright instead of creating a session with no API credentials.
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      if (!account.id_token) return false;

      let marketingConsent = false;
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        marketingConsent = cookieStore.get("marketing_consent")?.value === "true";
      } catch {}

      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: account.id_token,
            marketing_emails_enabled: marketingConsent,
          }),
        });
        if (!res.ok) {
          console.error("Backend Google auth failed:", res.status, await res.text());
          return false;
        }
        const data = await res.json();
        // Carried into the jwt callback via the shared user object.
        user.id = String(data.id);
        user.accessToken = data.access_token;
        user.createdAt = data.created_at;
        return true;
      } catch (error) {
        console.error("Backend Google auth failed:", error);
        return false;
      }
    },

    // Persist the FastAPI user ID and access token in the JWT cookie, and
    // keep the backend token fresh for as long as the session is active.
    async jwt({ token, user }) {
      // Initial sign-in (both providers put accessToken on the user object)
      if (user?.accessToken) {
        token.userId = user.id;
        token.accessToken = user.accessToken;
        token.createdAt = user.createdAt;
        token.accessTokenExpires = tokenExpiryMs(user.accessToken);
        delete token.error;
        return token;
      }

      // Subsequent requests: refresh the backend token before it expires.
      if (token.accessToken && token.accessTokenExpires) {
        const msLeft = token.accessTokenExpires - Date.now();

        if (msLeft <= 0) {
          token.error = "SessionExpired";
          return token;
        }

        if (msLeft < REFRESH_WINDOW_MS) {
          try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token.accessToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              token.accessToken = data.access_token;
              token.accessTokenExpires = tokenExpiryMs(data.access_token);
              delete token.error;
            } else if (res.status === 401) {
              // Backend refused to extend the session (e.g. 30-day cap hit).
              token.error = "SessionExpired";
            }
            // Other statuses / network errors: keep the current token and
            // retry on the next request — it's still valid for now.
          } catch {}
        }
      }
      return token;
    },

    // Expose userId and accessToken on the session so the frontend can use them
    async session({ session, token }) {
      session.user.id = token.userId;
      session.accessToken = token.accessToken;
      session.user.createdAt = token.createdAt;
      if (token.error) session.error = token.error;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
});
