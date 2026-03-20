import Link from "next/link";
import Footer from "@/components/Footer";
import { Shield, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — StuFin",
  description:
    "Learn how StuFin collects, uses, stores, and protects your personal data.",
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
  { href: "#overview", label: "Overview" },
  { href: "#data-we-collect", label: "Data We Collect" },
  { href: "#how-we-use", label: "How We Use Your Data" },
  { href: "#data-storage", label: "Data Storage & Security" },
  { href: "#data-sharing", label: "Data Sharing" },
  { href: "#cookies", label: "Cookies & Tracking" },
  { href: "#your-rights", label: "Your Rights" },
  { href: "#childrens-privacy", label: "Children&apos;s Privacy" },
  { href: "#changes", label: "Changes to This Policy" },
  { href: "#contact", label: "Contact Us" },
];

export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen bg-slate-50">

        {/* ── Hero ── */}
        <section className="bg-zinc-950 pt-24 pb-20 relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-900/20 blur-[100px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
              Legal
            </p>
            <h1 className="font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-bold tracking-tight text-white mb-5">
              Privacy Policy
            </h1>
            <p className="mx-auto max-w-xl text-base text-zinc-400 leading-relaxed">
              Your privacy matters. Here&apos;s exactly what data we collect,
              why we collect it, and how we protect it.
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
                  <Shield className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    Contents
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {TOC.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="text-xs text-zinc-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group"
                      >
                        <span className="h-px w-3 bg-zinc-300 group-hover:bg-blue-400 transition-colors shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: item.label }} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 space-y-10">

              {/* Intro highlight */}
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5 text-sm text-blue-900 leading-relaxed">
                <strong>The short version: </strong> StuFin is a manual-entry finance tracker.
                We do not connect to your bank. We do not sell your data. We do not run
                advertising. We collect only what&apos;s needed to run the service and keep your
                account secure.
              </div>

              <Section id="overview" title="1. Overview">
                <p>
                  This Privacy Policy explains how StuFin (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects,
                  uses, and safeguards information about you when you use our web application
                  at <strong>stufin.starkandco.site</strong> (&ldquo;Service&rdquo;).
                </p>
                <p>
                  StuFin is a personal project operated by Dylan, a student developer based in
                  Melbourne, Australia. We are committed to handling your personal information
                  responsibly and in accordance with the{" "}
                  <strong>Australian Privacy Act 1988 (Cth)</strong> and, where applicable,
                  the <strong>EU General Data Protection Regulation (GDPR)</strong>.
                </p>
              </Section>

              <Section id="data-we-collect" title="2. Data We Collect">
                <p>We collect information in two ways:</p>

                <p className="font-semibold text-zinc-800 mt-2">A. Information you provide directly</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Account information:</strong> your email address and a hashed password (or OAuth provider identifier if you sign in with Google)</li>
                  <li><strong>Financial data:</strong> asset balances, account values, income/expense entries, net worth snapshots, and check-in records that you manually enter</li>
                  <li><strong>Communications:</strong> if you contact us via email, we retain those messages for support purposes</li>
                </ul>

                <p className="font-semibold text-zinc-800 mt-3">B. Information collected automatically</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Log data:</strong> IP address, browser type, pages visited, and timestamps — used for security monitoring and debugging</li>
                  <li><strong>Session data:</strong> authentication session tokens necessary for keeping you logged in</li>
                </ul>

                <p>
                  We do <strong>not</strong> collect bank account numbers, card details, tax file numbers, or any other sensitive financial identifiers. All figures are manually entered by you.
                </p>
              </Section>

              <Section id="how-we-use" title="3. How We Use Your Data">
                <p>We use the data we collect to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Provide, maintain, and improve the StuFin service</li>
                  <li>Authenticate you and keep your account secure</li>
                  <li>Display your financial data back to you within the application</li>
                  <li>Respond to your support requests or enquiries</li>
                  <li>Detect and prevent fraud, abuse, or security incidents</li>
                  <li>Comply with legal obligations</li>
                </ul>
                <p>
                  We do <strong>not</strong> use your financial data to build advertising profiles,
                  train machine-learning models, or benchmark you against other users.
                </p>
              </Section>

              <Section id="data-storage" title="4. Data Storage & Security">
                <p>
                  Your data is stored on servers in a cloud environment. We implement
                  industry-standard security measures including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Encrypted connections (HTTPS/TLS) for all data in transit</li>
                  <li>Password hashing using bcrypt — we never store plaintext passwords</li>
                  <li>Access controls limiting who can access production data</li>
                </ul>
                <p>
                  While we take security seriously, no system is perfectly secure. We cannot
                  guarantee absolute security and encourage you to use a strong, unique password.
                </p>
                <p>
                  We retain your account and financial data for as long as your account is
                  active, or as needed to provide the service. If you request account deletion,
                  we will delete your data within <strong>30 days</strong>, except where
                  retention is required by law.
                </p>
              </Section>

              <Section id="data-sharing" title="5. Data Sharing">
                <p>
                  <strong>We do not sell, rent, or trade your personal information.</strong>
                </p>
                <p>
                  We may share data only in the following limited circumstances:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Service providers:</strong> third-party providers (e.g., cloud hosting, authentication) who access data only as necessary to provide their services and are bound by confidentiality obligations
                  </li>
                  <li>
                    <strong>Google OAuth:</strong> if you sign in with Google, we receive your name and email address from Google in accordance with Google&apos;s own privacy policy
                  </li>
                  <li>
                    <strong>Legal requirements:</strong> if required by law, court order, or government authority
                  </li>
                  <li>
                    <strong>Business transfer:</strong> if the service is ever sold or transferred, your data may be transferred as part of that transaction, with prior notice to you
                  </li>
                </ul>
              </Section>

              <Section id="cookies" title="6. Cookies & Tracking">
                <p>
                  StuFin uses a minimal number of cookies strictly necessary to operate the service:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Session cookies:</strong> to keep you authenticated between page loads</li>
                  <li><strong>CSRF protection tokens:</strong> to protect against cross-site request forgery attacks</li>
                </ul>
                <p>
                  We do <strong>not</strong> use advertising cookies, cross-site tracking cookies,
                  or analytics platforms that profile individual users (e.g., Google Analytics is
                  not currently deployed on StuFin).
                </p>
              </Section>

              <Section id="your-rights" title="7. Your Rights">
                <p>
                  Depending on your location, you may have the following rights regarding your
                  personal information:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Access:</strong> request a copy of the personal data we hold about you</li>
                  <li><strong>Correction:</strong> request correction of inaccurate data</li>
                  <li><strong>Deletion:</strong> request deletion of your account and associated data</li>
                  <li><strong>Portability:</strong> request your financial data in a machine-readable format</li>
                  <li><strong>Objection:</strong> object to certain types of processing</li>
                </ul>
                <p>
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:stufinsupport@gmail.com" className="text-blue-600 hover:underline">
                    stufinsupport@gmail.com
                  </a>
                  . We will respond within <strong>30 days</strong>.
                </p>
                <p>
                  If you are located in the EU/EEA, you also have the right to lodge a
                  complaint with your local data protection authority.
                </p>
              </Section>

              <Section id="childrens-privacy" title="8. Children's Privacy">
                <p>
                  StuFin is not directed at children under the age of 13. We do not knowingly
                  collect personal information from children under 13. If we become aware that
                  we have collected data from a child under 13 without parental consent, we will
                  promptly delete it. If you believe we may have such information, please
                  contact us at{" "}
                  <a href="mailto:stufinsupport@gmail.com" className="text-blue-600 hover:underline">
                    stufinsupport@gmail.com
                  </a>
                  .
                </p>
              </Section>

              <Section id="changes" title="9. Changes to This Policy">
                <p>
                  We may update this Privacy Policy from time to time. When we do, we will
                  revise the &ldquo;Last updated&rdquo; date at the top of this page. Material changes
                  will be communicated via email or a prominent in-app notice.
                </p>
                <p>
                  Your continued use of StuFin after any changes constitutes acceptance of the
                  updated policy.
                </p>
              </Section>

              <Section id="contact" title="10. Contact Us">
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy
                  or how your data is handled, please reach out:
                </p>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">StuFin Privacy</p>
                    <a
                      href="mailto:stufinsupport@gmail.com"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      stufinsupport@gmail.com
                    </a>
                  </div>
                </div>
              </Section>

              {/* CTA */}
              <div className="rounded-2xl bg-zinc-900 p-8 text-center">
                <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-white mb-2">
                  Also see our Terms of Service
                </h3>
                <p className="text-zinc-400 text-sm mb-6">
                  The rules that govern your use of the StuFin platform.
                </p>
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-7 py-3 text-sm font-bold transition-all duration-200 shadow-lg shadow-emerald-900/20 group"
                >
                  Read Terms of Service
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
