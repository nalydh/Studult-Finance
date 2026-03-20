import { Geist, Geist_Mono, Source_Code_Pro, Inter, Poppins } from "next/font/google";
import "./globals.css";
import "react-tooltip/dist/react-tooltip.css";
import { Metadata } from "next";
import ConditionalNav from "@/components/ConditionalNav";
import AuthProvider from "@/components/AuthProvider";

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
        </AuthProvider>
      </body>
    </html>
  );
}
