import { Geist, Geist_Mono, Source_Code_Pro, Inter, Poppins } from "next/font/google";
import "./globals.css";
import "react-tooltip/dist/react-tooltip.css";
import { Metadata } from "next";
import ConditionalNav from "@/components/ConditionalNav";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StuFin — Conscious Wealth-Building",
  description: "Stop automating. Start building. StuFin is your simplified weekly ritual to manually consolidate your entire financial universe and build a massive long-term position.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} ${geistSans.variable} ${geistMono.variable} ${sourceCodePro.variable} antialiased`}
      >
        <AuthProvider>
          <ConditionalNav />
          <div id="root-content">{children}</div>
          {/*
            Top offset clears the 65px fixed navbar (see ConditionalNav) plus a gap.
            richColors is deliberately off: its tinted backgrounds put light green
            text on light green, which reads poorly. Instead we use near-black text
            on white for legibility, and carry the status colour in the icon and a
            left border accent.
          */}
          <Toaster
            position="top-right"
            closeButton
            offset={{ top: "81px", right: "24px" }}
            mobileOffset={{ top: "77px", right: "16px", left: "16px" }}
            toastOptions={{
              classNames: {
                toast:
                  "!bg-white !border !border-zinc-200 !border-l-4 !rounded-xl !shadow-lg !shadow-black/10 !gap-3 !p-4",
                title: "!text-zinc-900 !font-semibold !text-sm !leading-snug",
                description: "!text-zinc-600 !text-sm !leading-snug !mt-0.5",
                closeButton:
                  "!bg-white !border-zinc-300 !text-zinc-600 hover:!text-zinc-900 hover:!bg-zinc-100",
                success: "!border-l-emerald-500 [&_[data-icon]]:!text-emerald-600",
                error: "!border-l-red-500 [&_[data-icon]]:!text-red-600",
                warning: "!border-l-amber-500 [&_[data-icon]]:!text-amber-600",
                info: "!border-l-blue-500 [&_[data-icon]]:!text-blue-600",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
