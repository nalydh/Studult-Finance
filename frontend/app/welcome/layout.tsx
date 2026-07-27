import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let hasPreferences = false;

  if (session && session.accessToken) {
    try {
      // Use 127.0.0.1 for server-side fetches to prevent Node.js IPv6 resolution issues
      const apiUrl = (process.env.NEXT_PUBLIC_API_BASE || "").replace("localhost", "127.0.0.1");
      const res = await fetch(`${apiUrl}/budget/preferences`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        hasPreferences = data.error !== "No preferences found";
      }
    } catch (error) {
      console.error("Failed to fetch preferences during SSR:", error);
    }
  }

  // Users who already completed onboarding shouldn't see the welcome page.
  // redirect() throws internally, so it must live OUTSIDE the try/catch —
  // inside, the catch swallows it and the redirect silently never happens.
  if (hasPreferences) redirect("/dashboard");

  return <>{children}</>;
}
