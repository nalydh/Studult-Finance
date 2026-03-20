import Link from "next/link";
import { TrendingUp } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/70">

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Brand column */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-[family-name:var(--font-poppins)] text-lg font-bold tracking-[0.25em]">
              <span className="text-zinc-300">STU</span>
              <span className="text-emerald-500">FIN</span>
            </span>
          </Link>

          {/* Tagline */}
          <p className="text-sm leading-relaxed text-zinc-400 max-w-xs">
            Your weekly and monthly ritual to stay on top of your finances —
            without the complexity of traditional budgeting apps.
          </p>


        </div>

        {/* Spacer */}
        <div className="hidden md:block md:col-span-1" />

        {/* Product links */}
        <div className="md:col-span-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-4">
            Product
          </p>
          <ul className="space-y-2.5">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company links */}
        <div className="md:col-span-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-4">
            Company
          </p>
          <ul className="space-y-2.5">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-zinc-800/70">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            &copy; {year} StuFin &mdash; Built for students &amp; young adults.
          </p>
          <span className="text-xs text-zinc-700">
            Manual first. Always.
          </span>
        </div>
      </div>

    </footer>
  );
}
