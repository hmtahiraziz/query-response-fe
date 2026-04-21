"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/icons";
import ServerInfoPanel from "@/components/ServerInfoPanel";
import {
  fetchProjects,
  fetchServerInfo,
  ingestProject,
  type IngestResult,
  type ProjectSummary,
  type ServerInfo,
} from "@/lib/api";
import { formatBytes } from "@/lib/format";

const INGEST_HINTS = [
  "Sending PDF to the API…",
  "Extracting text from pages and splitting into chunks…",
  "Embedding chunks with OpenAI…",
  "Upserting vectors into Pinecone…",
] as const;

/** Auto-hide ingest feedback so the form stays clean. */
const INGEST_SUCCESS_DISMISS_MS = 5000;
const INGEST_ERROR_DISMISS_MS = 6500;

function CheckIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

export default function ProjectsPage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestHintIndex, setIngestHintIndex] = useState(0);
  const [ingestElapsed, setIngestElapsed] = useState(0);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const ingestTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoadErr(null);
    try {
      const [p, i] = await Promise.all([fetchProjects(), fetchServerInfo()]);
      setProjects(p);
      setInfo(i);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load API");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (ingestTimerRef.current) clearInterval(ingestTimerRef.current);
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ingestResult) return;
    const t = setTimeout(() => setIngestResult(null), INGEST_SUCCESS_DISMISS_MS);
    return () => clearTimeout(t);
  }, [ingestResult]);

  useEffect(() => {
    if (!ingestError) return;
    const t = setTimeout(() => setIngestError(null), INGEST_ERROR_DISMISS_MS);
    return () => clearTimeout(t);
  }, [ingestError]);

  async function onIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setIngesting(true);
    setIngestError(null);
    setIngestResult(null);
    setIngestHintIndex(0);
    setIngestElapsed(0);

    const started = Date.now();
    ingestTimerRef.current = setInterval(() => {
      setIngestElapsed(Math.floor((Date.now() - started) / 1000));
    }, 500);
    hintTimerRef.current = setInterval(() => {
      setIngestHintIndex((i) => (i + 1) % INGEST_HINTS.length);
    }, 7000);

    try {
      const result = await ingestProject(file, displayName);
      setFile(null);
      setDisplayName("");
      setIngestResult(result);
      await refresh();
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : "Ingest failed");
    } finally {
      if (ingestTimerRef.current) {
        clearInterval(ingestTimerRef.current);
        ingestTimerRef.current = null;
      }
      if (hintTimerRef.current) {
        clearInterval(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      setIngesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8 border-b border-[var(--border)] pb-6">
        <h1 className="headline text-2xl font-semibold tracking-tight sm:text-3xl">Portfolio library</h1>
        <p className="mt-2 text-[var(--muted)]">
          Upload project PDFs (case studies, SRS, one-pagers). Text is chunked with OpenAI embeddings and stored in
          Pinecone. Legacy Gemini-indexed projects are hidden here and excluded from cover-letter retrieval; re-upload
          those PDFs to index them with OpenAI, or remove stale rows from your manifest if needed.
        </p>
        <div className="mt-6">
          <ServerInfoPanel info={info} loadErr={loadErr} variant="ingest" />
        </div>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="add-project-heading">
          <div className="mb-4">
            <h2 id="add-project-heading" className="text-lg font-semibold text-[var(--text)]">
              Add a project
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Choose a PDF and optional display name. New uploads appear in the list below once indexing completes.
            </p>
          </div>

          <form
            onSubmit={onIngest}
            aria-busy={ingesting}
            className={`space-y-4 rounded-xl border bg-[var(--surface)] p-5 sm:p-6 ${
              ingesting ? "border-[var(--accent)]/60 ring-1 ring-[var(--accent)]/25" : "border-[var(--border)]"
            }`}
          >
            <h3 className="sr-only">Upload PDF</h3>

            {ingesting && file && (
              <div
                role="status"
                aria-live="polite"
                className="flex gap-4 rounded-lg border border-[var(--accent)]/35 bg-[var(--accent-dim)] p-4"
              >
                <div
                  className="h-10 w-10 shrink-0 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-[var(--on-accent)]">Indexing in progress</p>
                  <p className="text-sm text-[var(--on-accent)]/80">{INGEST_HINTS[ingestHintIndex]}</p>
                  <p className="text-xs text-[var(--on-accent)]/70">
                    {file.name} · {formatBytes(file.size)} · elapsed {ingestElapsed}s
                  </p>
                  <p className="text-xs text-[var(--on-accent)]/55">
                    Keep this tab open until the request finishes. Large PDFs can take several minutes.
                  </p>
                </div>
              </div>
            )}

            {ingestResult && !ingesting && (
              <div
                role="status"
                aria-live="polite"
                className="relative overflow-hidden rounded-xl border border-[var(--accent)]/35 bg-gradient-to-br from-[var(--accent-dim)] to-black/60 px-4 py-4 shadow-lg shadow-black/30"
              >
                <div
                  className="ingest-toast-progress pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-[var(--accent)] motion-reduce:animate-none"
                  style={{ animationDuration: `${INGEST_SUCCESS_DISMISS_MS}ms` }}
                  aria-hidden
                />
                <div className="flex gap-3 pr-8">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/30 text-[var(--on-accent)]">
                    <CheckIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-semibold tracking-tight text-[var(--on-accent)]">Document indexed</p>
                      <p className="mt-0.5 truncate text-sm text-[var(--on-accent)]">{ingestResult.name}</p>
                      <p className="truncate text-xs text-[var(--on-accent)]/75">{ingestResult.filename}</p>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-black/25 px-2 py-1.5">
                        <dt className="text-[var(--on-accent)]/55">Pages</dt>
                        <dd className="font-medium text-[var(--on-accent)]">{ingestResult.pages}</dd>
                      </div>
                      <div className="rounded-md bg-black/25 px-2 py-1.5">
                        <dt className="text-[var(--on-accent)]/55">Chunks</dt>
                        <dd className="font-medium text-[var(--on-accent)]">{ingestResult.chunks}</dd>
                      </div>
                      <div className="rounded-md bg-black/25 px-2 py-1.5">
                        <dt className="text-[var(--on-accent)]/55">Embeddings</dt>
                        <dd className="font-medium capitalize text-[var(--on-accent)]">{ingestResult.embedding_provider}</dd>
                      </div>
                      <div className="col-span-3 rounded-md bg-black/25 px-2 py-1.5">
                        <dt className="text-[var(--on-accent)]/55">Project id</dt>
                        <dd
                          className="truncate font-mono text-[10px] text-[var(--on-accent)]/70"
                          title={ingestResult.project_id}
                        >
                          {ingestResult.project_id}
                        </dd>
                      </div>
                    </dl>
                    <p className="text-[10px] text-[var(--on-accent)]/50">
                      This message closes automatically in a few seconds.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIngestResult(null)}
                  className="absolute right-2 top-2 rounded p-1.5 text-[var(--on-accent)]/60 transition-colors hover:bg-white/10 hover:text-[var(--on-accent)]"
                  aria-label="Dismiss"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ×
                  </span>
                </button>
              </div>
            )}

            {ingestError && !ingesting && (
              <div
                role="alert"
                aria-live="assertive"
                className="relative overflow-hidden rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/8 px-4 py-4 shadow-lg shadow-black/20"
              >
                <div
                  className="ingest-toast-progress pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-[var(--danger)]/60 motion-reduce:animate-none"
                  style={{ animationDuration: `${INGEST_ERROR_DISMISS_MS}ms` }}
                  aria-hidden
                />
                <div className="flex gap-3 pr-8">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--danger)]/15 text-[var(--danger)]">
                    <AlertIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--danger)]">Could not index document</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--muted)]">{ingestError}</p>
                    <p className="mt-3 text-[10px] text-[var(--faint)]">This message closes automatically.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIngestError(null)}
                  className="absolute right-2 top-2 rounded p-1.5 text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
                  aria-label="Dismiss"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ×
                  </span>
                </button>
              </div>
            )}

            <label className="block text-sm text-[var(--muted)]">
              Display name
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Acme ecommerce rebuild"
                disabled={ingesting}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
              />
            </label>
            <label className="block text-sm text-[var(--muted)]">
              PDF file
              <input
                type="file"
                accept="application/pdf"
                disabled={ingesting}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1.5 file:text-[var(--on-accent)] file:font-medium hover:file:bg-[var(--accent-hover)] disabled:opacity-50"
              />
            </label>
            <button
              type="submit"
              disabled={!file || ingesting}
              className="w-full rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-dim)] py-2.5 text-sm font-medium text-[var(--on-accent)] shadow-sm transition hover:brightness-[1.02] disabled:opacity-40"
            >
              {ingesting ? "Working…" : "Ingest into Pinecone"}
            </button>
          </form>
        </section>

        <section className="border-t border-[var(--border)] pt-10" aria-labelledby="library-heading">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="library-heading" className="text-lg font-semibold text-[var(--text)]">
                Your library
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {projects.length === 0
                  ? "No PDFs indexed yet — add one in the section above."
                  : `${projects.length} indexed project${projects.length === 1 ? "" : "s"} ready for cover-letter retrieval.`}
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)]/40 px-4 py-10 text-center">
              <p className="text-sm text-[var(--muted)]">Nothing here yet.</p>
              <p className="mt-1 text-xs text-[var(--faint)]">Upload a PDF to see it listed with chunk and page counts.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {projects.map((p) => (
                <li key={p.project_id}>
                  <Link
                    href={`/projects/${encodeURIComponent(p.project_id)}`}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
                        {p.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                        {p.filename} · {p.pages} pp · {p.chunks} chunks · OpenAI
                      </p>
                      {p.ai_summary ? (
                        <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                          {p.ai_summary.project_brief ||
                            p.ai_summary.technical_depth ||
                            p.ai_summary.solution ||
                            p.ai_summary.problem ||
                            p.ai_summary.impact}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--faint)]">No AI summary yet — open to generate.</p>
                      )}
                    </div>
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-transparent text-[var(--faint)] transition-colors group-hover:border-[var(--border)] group-hover:bg-[var(--bg)]/50 group-hover:text-[var(--accent)]"
                      aria-hidden
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
