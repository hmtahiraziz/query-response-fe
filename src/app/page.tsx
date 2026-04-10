import Link from "next/link";

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
          className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
        >
          <h2 className="text-lg font-medium text-[var(--accent)]">Portfolio library</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Upload PDFs, chunk &amp; embed with Gemini, store vectors in Pinecone.
          </p>
          <span className="mt-4 inline-block text-sm text-[var(--text)] group-hover:underline">Open →</span>
        </Link>
        <Link
          href="/cover-letter"
          className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
        >
          <h2 className="text-lg font-medium text-[var(--accent)]">Cover letter</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Paste a brief or JD, retrieve context, draft a response, browse history.
          </p>
          <span className="mt-4 inline-block text-sm text-[var(--text)] group-hover:underline">Open →</span>
        </Link>
      </div>
    </div>
  );
}
