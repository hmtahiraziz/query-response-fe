"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ServerInfoPanel from "@/components/ServerInfoPanel";
import { deleteProject, fetchProjects, fetchServerInfo, ingestProject, type IngestResult, type ProjectSummary, type ServerInfo } from "@/lib/api";
import { formatBytes } from "@/lib/format";

const INGEST_HINTS = [
  "Sending PDF to the API…",
  "Extracting text from pages and splitting into chunks…",
  "Embedding chunks with Gemini…",
  "Upserting vectors into Pinecone…",
] as const;

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

  async function onDelete(id: string) {
    if (!confirm("Remove this project from the library and Pinecone?")) return;
    try {
      await deleteProject(id);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8 border-b border-[var(--border)] pb-6">
        <h1 className="headline text-2xl font-semibold tracking-tight sm:text-3xl">Portfolio library</h1>
        <p className="mt-2 text-[var(--muted)]">
          Upload project PDFs (case studies, SRS, one-pagers). Text is chunked, embedded with Gemini, and stored in
          Pinecone for retrieval on the Cover letter screen.
        </p>
        <div className="mt-6">
          <ServerInfoPanel info={info} loadErr={loadErr} variant="ingest" />
        </div>
      </header>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium text-[var(--text)]">Indexed projects</h2>
          <p className="text-sm text-[var(--muted)]">
            {projects.length === 0
              ? "No PDFs yet — add a document below."
              : `${projects.length} project(s) in the index.`}
          </p>
          <ul className="mt-4 space-y-2">
            {projects.map((p) => (
              <li
                key={p.project_id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {p.filename} · {p.pages} pp · {p.chunks} chunks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onDelete(p.project_id)}
                  className="shrink-0 rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={onIngest}
          aria-busy={ingesting}
          className={`space-y-4 rounded-xl border bg-[var(--surface)] p-5 ${
            ingesting ? "border-[var(--accent)]/60 ring-1 ring-[var(--accent)]/25" : "border-[var(--border)]"
          }`}
        >
          <h2 className="text-lg font-medium">Add project PDF</h2>

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
                <p className="text-sm font-medium text-[var(--text)]">Indexing in progress</p>
                <p className="text-sm text-[var(--muted)]">{INGEST_HINTS[ingestHintIndex]}</p>
                <p className="text-xs text-[var(--muted)]">
                  {file.name} · {formatBytes(file.size)} · elapsed {ingestElapsed}s
                </p>
                <p className="text-xs text-[var(--faint)]">
                  Keep this tab open until the request finishes. Large PDFs can take several minutes.
                </p>
              </div>
            </div>
          )}

          {ingestResult && !ingesting && (
            <div
              role="status"
              className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm"
            >
              <p className="font-medium text-emerald-200/95">Ingestion complete</p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-[var(--muted)]">
                <li>
                  <span className="text-[var(--text)]">{ingestResult.name}</span> ({ingestResult.filename})
                </li>
                <li>
                  {ingestResult.pages} pages → {ingestResult.chunks} chunks stored in Pinecone
                </li>
                <li className="font-mono text-xs text-[var(--faint)]">id: {ingestResult.project_id}</li>
              </ul>
            </div>
          )}

          {ingestError && !ingesting && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--danger)]/45 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
            >
              {ingestError}
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
              className="mt-1 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--accent-dim)] file:px-3 file:py-1.5 file:text-[var(--accent)] disabled:opacity-50"
            />
          </label>
          <button
            type="submit"
            disabled={!file || ingesting}
            className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-black disabled:opacity-40"
          >
            {ingesting ? "Working…" : "Ingest into Pinecone"}
          </button>
        </form>
      </div>
    </div>
  );
}
