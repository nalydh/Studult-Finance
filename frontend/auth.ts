import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

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
    // Called after a successful Google sign-in
    async signIn({ user, account, profile }) {
      return true;
    },

    // Persist the FastAPI user ID and access token in the JWT cookie
    async jwt({ token, user, account, profile }) {
      // 1. Initial sign-in for OAuth (Google)
      if (account?.provider === "google" && profile) {
        try {
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              google_id: profile.sub,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.userId = String(data.id);
            token.accessToken = data.access_token;
            token.createdAt = data.created_at;
          }
        } catch (error) {
          console.error("Backend auth failed:", error);
        }
      } 
      // 2. Initial sign-in for Credentials
      else if (user) {
        token.userId = user.id;
        // @ts-expect-error
        token.accessToken = user.accessToken;
        // @ts-expect-error
        token.createdAt = user.createdAt;
      }
      return token;
    },

    // Expose userId and accessToken on session.user so the frontend can use them
    async session({ session, token }) {
      session.user.id = token.userId as string;
      // @ts-expect-error
      session.accessToken = token.accessToken as string;
      // @ts-expect-error
      session.user.createdAt = token.createdAt as string;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
});
