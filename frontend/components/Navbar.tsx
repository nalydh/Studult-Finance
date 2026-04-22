"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, UserCircle2, LogOut, Flame, LogIn } from "lucide-react";
import { API_BASE } from "@/lib/api";

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authenticated";

  // Fetch streak when authenticated (requires Bearer token)
  useEffect(() => {
    if (!isAuthenticated || !session) return;
    // @ts-expect-error — accessToken added in auth.ts callbacks
    const token: string | undefined = session.accessToken;
    if (!token) return;

    function fetchStreak() {
      fetch(`${API_BASE}/snapshots/streak`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setStreak(data.streak ?? 0))
        .catch(() => setStreak(0));
    }

    fetchStreak();

    // Listen for manual refetch triggers
    window.addEventListener("streak-updated", fetchStreak);
    return () => window.removeEventListener("streak-updated", fetchStreak);
  }, [isAuthenticated, session]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="font-[family-name:var(--font-poppins)] text-lg font-bold tracking-[0.25em]">
            <span className="text-zinc-300">STU</span>
            <span className="text-emerald-500">FIN</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-300 hover:text-white hover:bg-zinc-800/60"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* ── Unauthenticated: Sign In button ── */}
          {status !== "loading" && !isAuthenticated && (
            <Link
              href="/auth/signin"
              className="hidden md:flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors duration-200"
            >
              Log In
            </Link>
          )}

          {/* ── Authenticated: Streak & Profile ── */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 relative" ref={profileRef}>
              
              {/* Gamified Streak Badge */}
              <div 
                title="Current Weekly Streak"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20"
              >
                <Flame className="w-4 h-4 text-orange-500 saturate-150" fill="currentColor" />
                <span className="text-sm font-bold text-orange-400">
                  {streak === null ? "..." : streak}
                </span>
              </div>

              <button
                id="navbar-profile-button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Open profile menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700 transition-colors hover:bg-zinc-700 hover:text-white"
              >
                <UserCircle2 className="h-5 w-5" />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 py-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">
                      Signed in as
                    </p>
                    <p
                      id="navbar-user-email"
                      className="text-sm font-semibold text-zinc-100 truncate"
                    >
                      {session?.user?.email ?? "—"}
                    </p>
                  </div>

                  {/* Sign out */}
                  <div className="px-2 py-1.5">
                    <button
                      id="navbar-signout-button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-zinc-300 transition-colors duration-300 hover:bg-zinc-800 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 pb-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:text-white hover:bg-zinc-800/60"
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile auth */}
          {!isAuthenticated && status !== "loading" && (
            <Link
              href="/auth/signin"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800/60 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}

          {isAuthenticated && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 w-full flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
