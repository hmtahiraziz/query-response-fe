import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cover letter",
  description: "Generate grounded responses from your portfolio",
};

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
