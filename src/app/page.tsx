import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="headline text-3xl font-semibold tracking-tight sm:text-4xl">Welcome</h1>
      <p className="mt-3 max-w-xl text-[var(--muted)]">
        Index your project documents, then generate client-ready cover letters grounded in what you&apos;ve actually
        shipped.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/projects"
          className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
        >
          <h2 className="text-lg font-medium text-[var(--accent)]">Portfolio library</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Upload PDFs, chunk &amp; embed with OpenAI, store vectors in Pinecone.
          </p>
          <div className="mt-5 flex justify-end">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]/30 text-[var(--muted)] transition-colors group-hover:border-[var(--accent)]/35 group-hover:bg-[var(--accent-dim)] group-hover:text-[var(--on-accent)]">
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          </div>
        </Link>
        <Link
          href="/cover-letter"
          className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
        >
          <h2 className="text-lg font-medium text-[var(--accent)]">Cover letter</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Paste a brief or JD, retrieve context, draft a response, browse history.
          </p>
          <div className="mt-5 flex justify-end">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]/30 text-[var(--muted)] transition-colors group-hover:border-[var(--accent)]/35 group-hover:bg-[var(--accent-dim)] group-hover:text-[var(--on-accent)]">
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
