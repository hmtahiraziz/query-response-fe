import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio library",
  description: "Upload and index project PDFs for RAG",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
