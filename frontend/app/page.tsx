"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, ReactNode } from "react";
import { ArrowRight, Wallet, Landmark, Package, Clock, BarChart3, ChevronRight, Eye, PiggyBank, TrendingUp, Shield } from "lucide-react";
import Footer from "@/components/Footer";

/* ─────────────────────────────────────────────────────────
   Scroll-reveal wrapper — animates children when they enter
   the viewport. Supports stagger via `delay` (ms).
───────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  type = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  type?: "up" | "fade";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationDelay = `${delay}ms`;
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`${type === "fade" ? "reveal-fade" : "reveal"} ${className}`}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Tutorial step data
───────────────────────────────────────────────────────── */
const tutorialSteps = [
  {
    step: "01",
    title: "Conscious 50/30/20 Splitting",
    desc: "Allocate your paycheck into Needs, Wants, and Investing. Stop the mindless flow.",
    icon: Wallet,
    imageUrl: "/screenshots/BudgetSplitterDEmo.png",
  },
  {
    step: "02",
    title: "Financial Account Ledger",
    desc: "Track your checking accounts, stock portfolios, and tackle debts like HECS. See your real trajectory.",
    icon: Landmark,
    imageUrl: "/screenshots/AccountLedgerDemo.png",
  },
  {
    step: "03",
    title: "Physical Asset Ledger",
    desc: "Add tech, collectibles, and physical holdings. Manual visibility prevents blind spending.",
    icon: Package,
    imageUrl: "/screenshots/AssetLedgetDemo.png",
  },
  {
    step: "04",
    title: "The Monthly Check-In",
    desc: "Your 10-minute monthly ritual to manually reconcile your numbers and stay conscious of your spending.",
    icon: Clock,
    imageUrl: "/screenshots/CheckInDemo.png",
  },
  {
    step: "05",
    title: "Trajectory & Data Graphs",
    desc: "Visualize your growth with multiple data graphs. See exactly how your intentional choices compound over time.",
    icon: BarChart3,
    imageUrl: "/screenshots/AnalyticsDemo.png",
  },
];

/* ═══════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      <main>
        {/* ═══════════════════════════════════════════
            SECTION 1 — HERO
        ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-zinc-950 pb-20">
          {/* Background atmosphere */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-emerald-900/20 blur-[120px] animate-glow-pulse" />
            <div className="absolute top-[60%] right-[20%] h-[400px] w-[400px] rounded-full bg-emerald-800/10 blur-[100px] animate-glow-pulse [animation-delay:4s]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          </div>

          {/* ── Hero headline ── */}
          <div className="relative z-10 mx-auto max-w-5xl px-6 pt-40 pb-24 text-center">
            <Reveal delay={0} type="up">
              <h1 className="font-[family-name:var(--font-inter)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] text-white">
                Check in monthly.
                <br />
                <span className="text-emerald-500 drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  Watch your wealth grow.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={180} type="fade" className="mt-6">
              <p className="mx-auto max-w-xl text-base sm:text-lg text-zinc-400 leading-relaxed">
                StuFin is your simplified monthly ritual to track net worth,
                split budgets, and build real wealth — intentionally.
              </p>
            </Reveal>

            <Reveal delay={320} type="fade" className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-3.5 text-sm font-bold transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 group"
              >
                Get started free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-8 py-3.5 text-sm font-semibold transition-all duration-200"
              >
                Sign in
              </Link>
            </Reveal>
          </div>

          {/* ── Tutorial: Interactive Feature Walkthrough ── */}
          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-40">
            <Reveal type="up" delay={100} className="mb-16 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
                How It Works
              </p>
              <h2 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Your Simplified Monthly Workflow
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
              {/* Left Side: Interactive Steps List */}
              <div className="flex flex-col space-y-4">
                {tutorialSteps.map((step, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <Reveal key={idx} type="up" delay={idx * 80}>
                      <button
                        onMouseEnter={() => setActiveStep(idx)}
                        onClick={() => setActiveStep(idx)}
                        className={`group relative flex w-full text-left gap-5 sm:gap-6 rounded-2xl border p-5 transition-all duration-300 ${
                          isActive
                            ? "border-zinc-700 bg-zinc-900/80 shadow-lg shadow-black/50"
                            : "border-transparent hover:border-zinc-800/50 hover:bg-zinc-900/30"
                        }`}
                      >
                        <div className={`relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          isActive
                            ? "border-emerald-500 bg-emerald-950/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 group-hover:border-zinc-700 group-hover:text-zinc-400"
                        }`}>
                          <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>

                        <div className="flex flex-col justify-center flex-grow">
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`font-[family-name:var(--font-source-code-pro)] text-xs font-bold transition-colors ${isActive ? "text-emerald-500/80" : "text-zinc-600"}`}>
                                {step.step}
                              </span>
                              <h3 className={`font-[family-name:var(--font-inter)] text-lg font-semibold transition-colors ${isActive ? "text-white" : "text-zinc-300"}`}>
                                {step.title}
                              </h3>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${isActive ? "text-emerald-500 translate-x-1" : "text-transparent -translate-x-2"}`} />
                          </div>
                          <p className={`text-sm leading-relaxed transition-colors ${isActive ? "text-zinc-400" : "text-zinc-500"}`}>
                            {step.desc}
                          </p>
                        </div>
                      </button>
                    </Reveal>
                  );
                })}
              </div>

              {/* Right Side: Sticky Screenshot Visualizer */}
              <Reveal type="fade" delay={200} className="relative hidden lg:block sticky top-32">
                <div className="rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                  {/* macOS-style chrome bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                    <div className="h-3 w-3 rounded-full bg-red-500/70" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
                    <div className="flex-1 mx-4 h-5 rounded-md bg-zinc-800/80" />
                  </div>

                  <div className="relative h-[540px] bg-slate-50 overflow-hidden">
                    {tutorialSteps.map((step, idx) => {
                      const isActive = activeStep === idx;
                      return (
                        <div
                          key={idx}
                          className={`absolute inset-0 overflow-y-auto transition-all duration-500 ${
                            isActive
                              ? "opacity-100 scale-100 z-10"
                              : "opacity-0 scale-[0.98] pointer-events-none z-0"
                          }`}
                        >
                          <Image
                            src={step.imageUrl}
                            alt={step.title}
                            width={900}
                            height={1200}
                            className="w-full h-auto"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        </div>
                      );
                    })}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-slate-50 to-transparent z-20" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Multi-layered dark-to-light gradient fade */}
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0">
            <div className="h-40 bg-gradient-to-b from-transparent via-zinc-900/80 to-zinc-800" />
            <div className="h-32 bg-gradient-to-b from-zinc-800 via-zinc-700/80 to-zinc-600/50" />
            <div className="h-24 bg-gradient-to-b from-zinc-600/50 via-zinc-400/30 to-slate-200/60" />
            <div className="h-16 bg-gradient-to-b from-slate-200/60 to-slate-50" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 2 — PHILOSOPHY
        ═══════════════════════════════════════════ */}
        <section className="bg-slate-50 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6">

            {/* Section header */}
            <Reveal type="up" className="text-center mb-14">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                The Philosophy
              </p>
              <h2 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-5">
                Why I Built StuFin
              </h2>
              <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-600">
                I built this tool because true financial clarity comes from regular and intentional check-ins.
                StuFin is your monthly ritual to collate your net worth and monitor your real performance.
              </p>
            </Reveal>

            {/* 3-column feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  icon: Eye,
                  title: "See the Big Picture",
                  body: "Stop tracking pennies. Monitor your overall trajectory and performance in one modern application.",
                },
                {
                  icon: PiggyBank,
                  title: "Pay Yourself First",
                  body: "Build the habit of spending what is left after you invest and save, not the other way around.",
                },
                {
                  icon: TrendingUp,
                  title: "Track Your Hustles",
                  body: "Keep track of asset sales, side hobbies, and physical collections that contribute to your financial freedom.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} type="up" delay={i * 100}>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 mb-5">
                      <Icon className="h-5 w-5 text-zinc-700" />
                    </div>
                    <h3 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-zinc-900 mb-3">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-500">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Golden Rule callout */}
            <Reveal type="up" delay={100}>
              <div className="mx-auto max-w-4xl bg-emerald-50/60 border border-emerald-200 rounded-2xl p-8 shadow-sm flex gap-6 items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <Shield className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-zinc-900 mb-2">
                    The 3-Account Prerequisite
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-zinc-600">
                    To get the absolute most out of StuFin, you don&apos;t need a complex
                    financial setup. You just need three standard bank accounts in real life:
                    <span className="font-semibold text-zinc-800"> Savings</span>,
                    <span className="font-semibold text-zinc-800"> Needs</span>, and
                    <span className="font-semibold text-zinc-800"> Wants</span>.
                    Set those up, check in once a month, and StuFin will handle the rest.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* CTA */}
            <Reveal type="up" delay={80} className="mt-14 text-center">
              <p className="text-sm text-zinc-500 mb-5">
                Ready to take control of your finances?
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3.5 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md group"
              >
                Give it a try
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Reveal>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
