import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

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
        // If they already have preferences, they shouldn't be on the welcome page!
        if (data.error !== "No preferences found") {
          redirect("/dashboard");
        }
      }
    } catch (error) {
      console.error("Failed to fetch preferences during SSR:", error);
    }
  }

  return <>{children}</>;
}
