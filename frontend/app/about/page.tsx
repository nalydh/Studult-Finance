import Link from "next/link";
import Footer from "@/components/Footer";
import { Mail, ArrowRight, Heart, Shield, BookOpen } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — StuFin",
  description: "Learn about StuFin, the philosophy behind it, and how to get in touch with the developer for support or questions.",
};

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-slate-50">

      {/* ── Hero ── */}
      <section className="bg-zinc-950 pt-24 pb-20 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-900/20 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
            About
          </p>
          <h1 className="font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-bold tracking-tight text-white mb-5">
            Built to facilitate the transition to adulthood.<br />
            <span className="text-emerald-400">Designed for discipline.</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-zinc-400 leading-relaxed">
            StuFin is a personal finance tool built on a simple belief: you should
            know exactly where your money is, where it&apos;s going, and where it&apos;s growing.
            No automations. Dedicate time to your finances and watch your wealth grow.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 space-y-16">

          {/* Who am I */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
              <Heart className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-inter)] text-xl font-bold text-zinc-900 mb-3">
                Who am I?
              </h2>
              <p className="text-zinc-600 leading-relaxed text-sm sm:text-base">
                Hi, I&apos;m Dylan — a student developer who built StuFin for people who are trying to navigate 
                the transition to adulthood. I am obsessed with personal finance and enjoy building tools that help people 
                achieve their financial goals. 

              </p>
              <p className="text-zinc-600 leading-relaxed text-sm sm:text-base mt-3">
                I&apos;m based in Melbourne, Australia and currently study at Monash University. StuFin is a side project built
                in my own time, shaped by my own financial journey.
              </p>
            </div>
          </div>

          {/* Philosophy */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
              <BookOpen className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-inter)] text-xl font-bold text-zinc-900 mb-3">
                The philosophy
              </h2>
              <p className="text-zinc-600 leading-relaxed text-sm sm:text-base">
                Most personal finance apps try to automate everything. StuFin does the opposite.
                The act of <strong className="text-zinc-800">manually entering your numbers</strong> is
                the point — it creates awareness, accountability, and intention. You can&apos;t
                fool yourself when you&apos;re the one typing the balance.
              </p>
              <p className="text-zinc-600 leading-relaxed text-sm sm:text-base mt-3">
                The custom budget splitting based on your preference, the monthly check-in ritual, the net worth snapshot —
                these aren&apos;t just features. They&apos;re a framework for building genuine
                financial literacy, one month at a time.
                I am a big believer of tracking your financial position to facilitate small or big financial decisions that will
                impact your life. StuFin is intentionally simple, provides you the information you need to see and nothing else.
              </p>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
              <Shield className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-inter)] text-xl font-bold text-zinc-900 mb-3">
                Your data is yours
              </h2>
              <p className="text-zinc-600 leading-relaxed text-sm sm:text-base">
                StuFin never connects to your bank. You enter balances manually. There are no
                third-party data brokers, no advertising, and no selling of your information.
                Your financial data is stored securely and is only ever visible to you.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200" />

          {/* Contact */}
          <div>
            <h2 className="font-[family-name:var(--font-inter)] text-xl font-bold text-zinc-900 mb-2">
              Get in touch
            </h2>
            <p className="text-zinc-500 text-sm mb-8">
              Have a question, found a bug, or want new features? I&apos;d love to hear from you.
              Please reach out via email.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {/* Email */}
              <a
                href="mailto:stufinsupport@gmail.com"
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                  <Mail className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Email support</p>
                  <p className="text-xs text-zinc-400 mt-0.5">stufinsupport@gmail.com</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 ml-auto transition-all" />
              </a>
            </div>

            <p className="mt-6 text-xs text-zinc-400">
              Response times may vary — I&apos;m a solo student developer. I do my best to reply within a few days.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-zinc-900 p-8 text-center">
            <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-white mb-2">
              Ready to start tracking?
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Create a free account and complete your first check-in in under 5 minutes.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-7 py-3 text-sm font-bold transition-all duration-200 shadow-lg shadow-emerald-900/20 group"
            >
              Get started free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
