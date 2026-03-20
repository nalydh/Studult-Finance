"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

// Routes where the Navbar and top padding should NOT appear
const NAVBAR_EXCLUDED = ["/auth"];

export default function ConditionalNav() {
  const pathname = usePathname();
  const isExcluded = NAVBAR_EXCLUDED.some((prefix) => pathname.startsWith(prefix));

  if (isExcluded) return null;

  return (
    <>
      <Navbar />
      {/* Spacer div to push content below the fixed navbar */}
      <div className="h-[65px]" />
    </>
  );
}
