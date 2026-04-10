import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import AppNav from "@/components/AppNav";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portfolio Cover Letter",
  description: "Grounded cover letters from your project PDFs (Gemini + Pinecone)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className={`${sans.className} flex min-h-screen flex-col antialiased`}>
        <AppNav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
