import { auth } from "./auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/analytics", "/check-in", "/budget", "/welcome"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && (!req.auth || req.auth.error)) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    if (req.auth?.error) signInUrl.searchParams.set("expired", "1");
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|screenshots|icons).*)"],
};
