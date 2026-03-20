import Link from "next/link";
import Footer from "@/components/Footer";
import { FileText, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — StuFin",
  description:
    "Read StuFin's Terms of Service to understand the rules and guidelines governing your use of the platform.",
};

const LAST_UPDATED = "20 March 2026";

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="font-[family-name:var(--font-inter)] text-lg font-bold text-zinc-900 mb-3 pb-2 border-b border-slate-200">
        {title}
      </h2>
      <div className="text-zinc-600 text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

const TOC = [
  { href: "#acceptance", label: "Acceptance of Terms" },
  { href: "#description", label: "Description of Service" },
  { href: "#eligibility", label: "Eligibility" },
  { href: "#accounts", label: "Accounts & Registration" },
  { href: "#acceptable-use", label: "Acceptable Use" },
  { href: "#intellectual-property", label: "Intellectual Property" },
  { href: "#disclaimer", label: "Disclaimers" },
  { href: "#limitation", label: "Limitation of Liability" },
  { href: "#termination", label: "Termination" },
  { href: "#changes", label: "Changes to Terms" },
  { href: "#governing-law", label: "Governing Law" },
  { href: "#contact", label: "Contact" },
];

export default function TermsPage() {
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
              Legal
            </p>
            <h1 className="font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-bold tracking-tight text-white mb-5">
              Terms of Service
            </h1>
            <p className="mx-auto max-w-xl text-base text-zinc-400 leading-relaxed">
              Please read these terms carefully before using StuFin. By accessing
              or using our service, you agree to be bound by them.
            </p>
            <p className="mt-4 text-xs text-zinc-600">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </section>

        {/* ── Body ── */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6 flex flex-col lg:flex-row gap-12">

            {/* ── Sidebar TOC ── */}
            <aside className="lg:w-56 shrink-0">
              <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    Contents
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {TOC.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="text-xs text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-1.5 group"
                      >
                        <span className="h-px w-3 bg-zinc-300 group-hover:bg-emerald-400 transition-colors shrink-0" />
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 space-y-10">

              {/* Intro */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-sm text-emerald-800 leading-relaxed">
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
                StuFin (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a personal finance tracking web application
                available at <strong>stufin.starkandco.site</strong>. By creating an account or using any
                part of the service, you agree to these Terms. If you do not agree, please do
                not use StuFin.
              </div>

              <Section id="acceptance" title="1. Acceptance of Terms">
                <p>
                  By accessing or using StuFin in any way — including without limitation,
                  visiting or browsing the website, creating an account, or submitting data —
                  you affirm that you have read, understood, and agree to be legally bound by
                  these Terms, as well as our{" "}
                  <Link href="/privacy" className="text-emerald-600 hover:underline font-medium">
                    Privacy Policy
                  </Link>
                  , which is incorporated herein by reference.
                </p>
              </Section>

              <Section id="description" title="2. Description of Service">
                <p>
                  StuFin is a manual personal finance tracking tool designed for students and
                  young adults. The service allows users to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Record and track asset balances, account values, and net worth</li>
                  <li>Log income and categorise expenses using a budget splitter</li>
                  <li>Perform monthly financial check-ins</li>
                  <li>View analytics and financial trends over time</li>
                </ul>
                <p>
                  StuFin is a <strong>manual-entry tool only</strong>. It does not connect to
                  any bank, financial institution, or third-party financial data provider.
                  Nothing in the service constitutes financial advice.
                </p>
              </Section>

              <Section id="eligibility" title="3. Eligibility">
                <p>
                  You must be at least <strong>13 years of age </strong> to use StuFin. If you
                  are under 18, you represent that you have your parent or guardian&apos;s permission
                  to use the service. By using StuFin, you represent and warrant that you meet
                  this requirement.
                </p>
                <p>
                  StuFin is currently available to users worldwide. Access to certain features
                  may be restricted in specific regions due to applicable laws.
                </p>
              </Section>

              <Section id="accounts" title="4. Accounts & Registration">
                <p>
                  To access most features of StuFin, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Provide accurate, current, and complete registration information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Keep your password confidential and not share it with others</li>
                  <li>Be solely responsible for all activity that occurs under your account</li>
                  <li>Notify us immediately at <a href="mailto:stufinsupport@gmail.com" className="text-emerald-600 hover:underline">stufinsupport@gmail.com</a> if you suspect unauthorised access</li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts at our sole discretion,
                  including for violation of these Terms.
                </p>
              </Section>

              <Section id="acceptable-use" title="5. Acceptable Use">
                <p>You agree not to use StuFin to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Violate any applicable local, state, national, or international law or regulation</li>
                  <li>Attempt to gain unauthorised access to other user accounts or our systems</li>
                  <li>Transmit any malware, viruses, or other harmful code</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the service</li>
                  <li>Use automated scripts, bots, or scrapers to access the service</li>
                  <li>Infringe the intellectual property rights of StuFin or any third party</li>
                  <li>Engage in any conduct that restricts or inhibits anyone&apos;s use or enjoyment of the service</li>
                </ul>
                <p>
                  We reserve the right to investigate and take appropriate action, including
                  removing content and terminating accounts, for any violation of this section.
                </p>
              </Section>

              <Section id="intellectual-property" title="6. Intellectual Property">
                <p>
                  You are granted a limited, non-exclusive, non-transferable licence to access and use the service for your personal, non-commercial purposes.
                </p>
                <p>
                  You retain ownership of all financial data you enter into StuFin. By
                  submitting data, you grant us a limited licence to store and process it solely
                  to provide the service to you. We do not claim ownership of your data.
                </p>
              </Section>

              <Section id="disclaimer" title="7. Disclaimers">
                <p>
                  <strong>StuFin is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any
                  kind</strong>, either express or implied, including but not limited to implied
                  warranties of merchantability, fitness for a particular purpose, or
                  non-infringement.
                </p>
                <p>
                  StuFin is a personal project maintained by a solo student developer.
                  We do not guarantee that the service will be error-free, uninterrupted, or
                  completely secure. We are not liable for any loss of data.
                </p>
                <p>
                  <strong>
                    Nothing in StuFin constitutes financial, investment, tax, or legal advice.
                  </strong>{" "}
                  All financial decisions are made solely by you. We strongly recommend
                  consulting a qualified financial professional before making significant
                  financial decisions.
                </p>
              </Section>

              <Section id="limitation" title="8. Limitation of Liability">
                <p>
                  To the fullest extent permitted by applicable law, StuFin and its developer
                  shall not be liable for any indirect, incidental, special, consequential, or
                  punitive damages, including but not limited to loss of profits, data, or
                  goodwill, arising out of or in connection with your use of — or inability to
                  use — the service.
                </p>
                <p>
                  In no event will our total aggregate liability to you exceed the greater of
                  AUD $50 or the amount you paid us (if any) in the past twelve months.
                </p>
              </Section>

              <Section id="termination" title="9. Termination">
                <p>
                  You may stop using StuFin at any time. You may request deletion of your
                  account and associated data by contacting us at{" "}
                  <a href="mailto:stufinsupport@gmail.com" className="text-emerald-600 hover:underline">
                    stufinsupport@gmail.com
                  </a>
                  .
                </p>
                <p>
                  We reserve the right to suspend or terminate your account without notice if
                  we reasonably believe you have violated these Terms, or if we discontinue the
                  service. Upon termination, your right to use StuFin will immediately cease.
                </p>
              </Section>

              <Section id="changes" title="10. Changes to Terms">
                <p>
                  We may update these Terms from time to time. When we do, we will revise the
                  &ldquo;Last updated&rdquo; date at the top of this page. If we make material changes, we
                  will make reasonable efforts to notify you (for example, via email or a
                  prominent notice within the app).
                </p>
                <p>
                  Your continued use of StuFin after any changes constitutes your acceptance
                  of the updated Terms.
                </p>
              </Section>

              <Section id="governing-law" title="11. Governing Law">
                <p>
                  These Terms are governed by and construed in accordance with the laws of
                  Victoria, Australia, without regard to its conflict of law provisions.
                  Any disputes arising under these Terms shall be subject to the exclusive
                  jurisdiction of the courts of Victoria, Australia.
                </p>
              </Section>

              <Section id="contact" title="12. Contact">
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">StuFin Legal</p>
                    <a
                      href="mailto:stufinsupport@gmail.com"
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      stufinsupport@gmail.com
                    </a>
                  </div>
                </div>
              </Section>

              {/* CTA */}
              <div className="rounded-2xl bg-zinc-900 p-8 text-center">
                <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-white mb-2">
                  Also see our Privacy Policy
                </h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Understand how we collect, use, and protect your data.
                </p>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-7 py-3 text-sm font-bold transition-all duration-200 shadow-lg shadow-emerald-900/20 group"
                >
                  Read Privacy Policy
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
