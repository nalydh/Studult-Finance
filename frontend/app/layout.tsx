import { Geist, Geist_Mono, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import "react-tooltip/dist/react-tooltip.css";
import { Metadata } from "next";

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
  title: "Studult Finance",
  description: "Useful finance tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceCodePro.variable} antialiased`}
      >
        <div className="px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
