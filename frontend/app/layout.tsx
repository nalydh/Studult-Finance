import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-tooltip/dist/react-tooltip.css";
import { Metadata } from "next";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
