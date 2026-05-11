import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // @ts-expect-error - accessToken is added to session in auth.ts
  if (session && session.accessToken) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/budget/preferences`, {
        headers: {
          // @ts-expect-error
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.error === "No preferences found") {
          redirect("/welcome");
        }
      }
    } catch (error) {
      console.error("Failed to fetch preferences during SSR:", error);
    }
  }

  return <>{children}</>;
}
