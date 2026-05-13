import Link from "next/link";
import { ChevronRightIcon, FolderStackIcon, PenLineIcon, ZapIcon } from "@/components/icons";

export default function HomePage() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(52vh,28rem)] bg-gradient-to-b from-[var(--accent)]/12 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:pt-20">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">
          Grounded in your shipped work
        </p>
        <h1 className="headline mt-4 text-center text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-gradient-accent">Cover letters</span>
          <span className="block text-[var(--text)]">that cite the real build</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Index project PDFs, retrieve the right passages from Pinecone, and draft responses tied to what you actually
          delivered — not generic fluff.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition hover:bg-[var(--accent-hover)] hover:shadow-[var(--accent)]/35"
          >
            <FolderStackIcon className="h-4 w-4 opacity-90" />
            Open portfolio library
            <ChevronRightIcon className="h-4 w-4 opacity-80" />
          </Link>
          <Link
            href="/cover-letter"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"
          >
            <PenLineIcon className="h-4 w-4 text-[var(--accent-soft)]" />
            Draft a cover letter
          </Link>
        </div>

        <ul className="mx-auto mt-14 grid max-w-3xl gap-3 text-left text-sm text-[var(--muted)] sm:grid-cols-3 sm:gap-4">
          <li className="rounded-xl border border-[var(--border)]/80 bg-[var(--surface)]/40 px-4 py-3 backdrop-blur-sm">
            <span className="font-medium text-[var(--text)]">Ingest</span> — PDFs chunked and embedded with OpenAI,
            vectors in Pinecone.
          </li>
          <li className="rounded-xl border border-[var(--border)]/80 bg-[var(--surface)]/40 px-4 py-3 backdrop-blur-sm">
            <span className="font-medium text-[var(--text)]">Retrieve</span> — brief-aware context from your library
            before generation.
          </li>
          <li className="rounded-xl border border-[var(--border)]/80 bg-[var(--surface)]/40 px-4 py-3 backdrop-blur-sm sm:col-span-1">
            <span className="font-medium text-[var(--text)]">Refine</span> — versioned drafts, AI polish, and optional
            PDF export.
          </li>
        </ul>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:gap-6">
          <Link
            href="/projects"
            className="card-interactive group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-7 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-dim)] text-[var(--accent-soft)]">
                <FolderStackIcon className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-[var(--border)] bg-black/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">
                Step 1
              </span>
            </div>
            <h2 className="headline mt-6 text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
              Portfolio library
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
              Upload case studies and specs. Everything stays tied to your corpus so later answers trace back to source
              pages.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
              <ZapIcon className="h-4 w-4" />
              <span>Index a PDF</span>
              <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/cover-letter"
            className="card-interactive group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-7 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-dim)] text-[var(--accent-soft)]">
                <PenLineIcon className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-[var(--border)] bg-black/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">
                Step 2
              </span>
            </div>
            <h2 className="headline mt-6 text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
              Cover letter
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
              Paste a JD or client brief, pull grounded snippets, then iterate with version history and optional AI
              refines.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
              <ZapIcon className="h-4 w-4" />
              <span>Generate from brief</span>
              <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
