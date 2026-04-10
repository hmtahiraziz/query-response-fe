"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssistantRulesPanel from "@/components/AssistantRulesPanel";
import ServerInfoPanel from "@/components/ServerInfoPanel";
import {
  deleteCoverLetterHistoryEntry,
  fetchCoverLetterHistory,
  fetchCoverLetterHistoryEntry,
  fetchProjects,
  fetchServerInfo,
  generateCoverLetter,
  patchCoverLetterHistory,
  type CoverLetterHistorySummary,
  type ServerInfo,
  type SourceSnippet,
} from "@/lib/api";
import {
  clearCoverLetterSession,
  loadCoverLetterSession,
  saveCoverLetterSession,
} from "@/lib/coverLetterSessionStorage";
import type { DraftVersion } from "@/lib/draftVersions";
import { detailToDraftVersions, versionMenuLabel } from "@/lib/draftVersions";
import LetterDraft from "@/components/LetterDraft";
import RefineWithAi from "@/components/RefineWithAi";
import { formatHistoryDate } from "@/lib/format";

const GENERATE_HINTS = [
  "Retrieving relevant portfolio chunks from Pinecone…",
  "Calling Gemini to draft your letter…",
  "If Google rate-limits, the server waits and retries automatically (can add time)…",
  "Still working — large briefs or quota backoff can take a minute or more…",
] as const;

function newId(): string {
  return crypto.randomUUID();
}

export default function CoverLetterPage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const genHintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [query, setQuery] = useState("");
  const [kChunks, setKChunks] = useState<number | "">("");
  const [generating, setGenerating] = useState(false);
  const [genHintIndex, setGenHintIndex] = useState(0);
  const [genElapsed, setGenElapsed] = useState(0);

  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [markdownEditorOpen, setMarkdownEditorOpen] = useState(false);

  const [sources, setSources] = useState<SourceSnippet[]>([]);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [coverHistory, setCoverHistory] = useState<CoverLetterHistorySummary[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  /** History row id to PATCH on manual save (kept after AI refine clears sidebar highlight) */
  const [serverHistoryId, setServerHistoryId] = useState<string | null>(null);
  const [savingManualVersion, setSavingManualVersion] = useState(false);

  const activeVersion = useMemo(
    () => draftVersions.find((v) => v.id === activeVersionId) ?? null,
    [draftVersions, activeVersionId]
  );

  const isDirty = Boolean(activeVersion && editorValue !== activeVersion.body);

  const refresh = useCallback(async () => {
    setLoadErr(null);
    try {
      const [p, i] = await Promise.all([fetchProjects(), fetchServerInfo()]);
      setProjectCount(p.length);
      setInfo(i);
      try {
        setCoverHistory(await fetchCoverLetterHistory());
      } catch {
        setCoverHistory([]);
      }
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load API");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
      if (genHintTimerRef.current) clearInterval(genHintTimerRef.current);
    };
  }, []);

  const sessionRestoredRef = useRef(false);
  useEffect(() => {
    if (sessionRestoredRef.current) return;
    const saved = loadCoverLetterSession();
    if (!saved) {
      sessionRestoredRef.current = true;
      return;
    }
    sessionRestoredRef.current = true;

    void (async () => {
      if (saved.serverHistoryId) {
        try {
          const d = await fetchCoverLetterHistoryEntry(saved.serverHistoryId);
          const vers = detailToDraftVersions(d);
          setQuery(d.query);
          setKChunks(d.k ?? "");
          setSources(d.sources);
          setDraftVersions(vers);
          const pick =
            vers.find((v) => v.id === saved.activeVersionId) ?? vers[vers.length - 1];
          setActiveVersionId(pick.id);
          setEditorValue(pick.body);
          setServerHistoryId(saved.serverHistoryId);
          setViewingHistoryId(saved.viewingHistoryId === d.id ? saved.viewingHistoryId : null);
          return;
        } catch {
          /* fall back to local snapshot */
        }
      }
      if (saved.draftVersions.length > 0) {
        setQuery(saved.query);
        setKChunks(saved.kChunks ?? "");
        setSources(saved.sources);
        setDraftVersions(saved.draftVersions);
        setActiveVersionId(saved.activeVersionId);
        setEditorValue(saved.editorValue);
        setServerHistoryId(saved.serverHistoryId);
        setViewingHistoryId(saved.viewingHistoryId);
      }
    })();
  }, []);

  const selectVersion = useCallback(
    (nextId: string) => {
      if (nextId === activeVersionId) return;
      const target = draftVersions.find((v) => v.id === nextId);
      if (!target) return;
      if (isDirty) {
        if (!confirm("Discard unsaved edits in the editor and switch to this version?")) return;
      }
      setActiveVersionId(nextId);
      setEditorValue(target.body);
      setMarkdownEditorOpen(false);
    },
    [activeVersionId, draftVersions, isDirty]
  );

  const discardEditorEdits = useCallback(() => {
    if (!activeVersion) return;
    setEditorValue(activeVersion.body);
  }, [activeVersion]);

  const saveManualVersion = useCallback(async () => {
    const trimmed = editorValue.trim();
    if (trimmed.length < 10) return;
    const localVid = newId();

    if (serverHistoryId) {
      setSavingManualVersion(true);
      try {
        await patchCoverLetterHistory(serverHistoryId, trimmed, { versionSource: "manual" });
        setDraftVersions((prev) => [
          ...prev,
          { id: localVid, createdAt: Date.now(), source: "manual", body: trimmed },
        ]);
        setActiveVersionId(localVid);
        setEditorValue(trimmed);
        setMarkdownEditorOpen(false);
        setViewingHistoryId(serverHistoryId);
        await refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Could not save to server");
      } finally {
        setSavingManualVersion(false);
      }
      return;
    }

    setDraftVersions((prev) => [...prev, { id: localVid, createdAt: Date.now(), source: "manual", body: trimmed }]);
    setActiveVersionId(localVid);
    setEditorValue(trimmed);
    setMarkdownEditorOpen(false);
    setViewingHistoryId(null);
    alert(
      "Saved as a new version locally only. Use Generate cover letter or Open on a history item once so manual saves can sync to MongoDB / the JSON history file."
    );
  }, [editorValue, serverHistoryId, refresh]);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (projectCount === 0) {
      setGenErr("Add at least one project PDF on the Portfolio library screen first.");
      return;
    }
    setGenerating(true);
    setGenErr(null);
    setDraftVersions([]);
    setActiveVersionId(null);
    setEditorValue("");
    setMarkdownEditorOpen(false);
    setServerHistoryId(null);
    setSources([]);
    setGenHintIndex(0);
    setGenElapsed(0);

    const started = Date.now();
    genTimerRef.current = setInterval(() => {
      setGenElapsed(Math.floor((Date.now() - started) / 1000));
    }, 500);
    genHintTimerRef.current = setInterval(() => {
      setGenHintIndex((i) => (i + 1) % GENERATE_HINTS.length);
    }, 8000);

    try {
      const kk = kChunks === "" ? undefined : Number(kChunks);
      const res = await generateCoverLetter(query, kk);
      const initialId = `${res.history_id}-initial`;
      setDraftVersions([
        { id: initialId, createdAt: Date.now(), source: "generate", body: res.cover_letter },
      ]);
      setActiveVersionId(initialId);
      setEditorValue(res.cover_letter);
      setMarkdownEditorOpen(false);
      setSources(res.sources);
      setViewingHistoryId(res.history_id);
      setServerHistoryId(res.history_id);
      await refresh();
    } catch (err) {
      setGenErr(err instanceof Error ? err.message : "Generation failed");
    } finally {
      if (genTimerRef.current) {
        clearInterval(genTimerRef.current);
        genTimerRef.current = null;
      }
      if (genHintTimerRef.current) {
        clearInterval(genHintTimerRef.current);
        genHintTimerRef.current = null;
      }
      setGenerating(false);
    }
  }

  async function openHistoryEntry(id: string) {
    try {
      const d = await fetchCoverLetterHistoryEntry(id);
      setQuery(d.query);
      const vers = detailToDraftVersions(d);
      setDraftVersions(vers);
      const last = vers[vers.length - 1];
      setActiveVersionId(last.id);
      setEditorValue(last.body);
      setMarkdownEditorOpen(false);
      setSources(d.sources);
      setKChunks(d.k ?? "");
      setViewingHistoryId(d.id);
      setServerHistoryId(d.id);
      setGenErr(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not load entry");
    }
  }

  async function removeHistoryEntry(id: string) {
    if (!confirm("Delete this saved cover letter from history?")) return;
    try {
      await deleteCoverLetterHistoryEntry(id);
      if (viewingHistoryId === id) {
        setViewingHistoryId(null);
      }
      if (serverHistoryId === id) {
        setServerHistoryId(null);
        clearCoverLetterSession();
      }
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function startNewDraft() {
    clearCoverLetterSession();
    setQuery("");
    setDraftVersions([]);
    setActiveVersionId(null);
    setEditorValue("");
    setSources([]);
    setKChunks("");
    setViewingHistoryId(null);
    setServerHistoryId(null);
    setGenErr(null);
    setMarkdownEditorOpen(false);
  }

  const hasDraft = draftVersions.length > 0;

  useEffect(() => {
    if (!hasDraft) return;
    const t = window.setTimeout(() => {
      saveCoverLetterSession({
        serverHistoryId,
        viewingHistoryId,
        query,
        kChunks,
        sources,
        draftVersions,
        activeVersionId,
        editorValue,
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [
    hasDraft,
    serverHistoryId,
    viewingHistoryId,
    query,
    kChunks,
    sources,
    draftVersions,
    activeVersionId,
    editorValue,
  ]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col md:flex-row md:items-start">
      <aside
        className="order-2 flex w-full max-h-[40vh] shrink-0 flex-col overflow-hidden border-t border-[var(--border)] bg-[var(--surface)] md:order-1 md:max-h-[calc(100vh-3.5rem)] md:w-72 md:border-t-0 md:border-r md:border-b-0 md:sticky md:top-14 lg:w-80"
        aria-label="Cover letter history"
      >
        <div className="flex min-h-0 flex-1 flex-col md:max-h-[calc(100vh-3.5rem)]">
          <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-medium text-[var(--text)]">History</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{coverHistory.length} saved on server</p>
              </div>
              <button
                type="button"
                onClick={startNewDraft}
                className="shrink-0 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-dim)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)] hover:border-[var(--accent)]"
                aria-label="Start a new cover letter draft"
              >
                New draft
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 md:px-4">
            {coverHistory.length === 0 ? (
              <p className="text-sm text-[var(--faint)]">No drafts yet. Generate one in the editor →</p>
            ) : (
              <ul className="space-y-2">
                {coverHistory.map((h) => (
                  <li
                    key={h.id}
                    className={`rounded-lg border p-2.5 ${
                      viewingHistoryId === h.id
                        ? "border-[var(--accent)]/50 bg-[var(--accent-dim)]"
                        : "border-[var(--border)] bg-[var(--bg)]"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wide text-[var(--faint)]">
                      {formatHistoryDate(h.created_at)}
                    </p>
                    <p className="mt-1 line-clamp-3 text-xs leading-snug text-[var(--text)]">{h.query_preview}</p>
                    {h.k != null && (
                      <p className="mt-1 text-[10px] text-[var(--muted)]">k={h.k}</p>
                    )}
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => void openHistoryEntry(h.id)}
                        className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--accent)] hover:border-[var(--accent)]"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeHistoryEntry(h.id)}
                        className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
                      >
                        Del
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <div className="order-1 min-w-0 flex-1 px-4 py-8 sm:px-6 md:order-2">
        <header className="mb-8 border-b border-[var(--border)] pb-6">
          <h1 className="headline text-2xl font-semibold tracking-tight sm:text-3xl">Cover letter</h1>
          <p className="mt-2 text-[var(--muted)]">
            Paste a client brief or job description. The app retrieves relevant passages from your indexed projects and
            drafts a grounded response you can refine.
          </p>
          {projectCount === 0 && !loadErr && (
            <p className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
              No projects indexed yet — go to <strong>Portfolio library</strong> and upload at least one PDF before
              generating.
            </p>
          )}
          <div className="mt-6">
            <ServerInfoPanel info={info} loadErr={loadErr} variant="compose" />
          </div>
          <div className="mt-4">
            <AssistantRulesPanel storageBackend={info?.assistant_rules_backend} />
          </div>
        </header>

        <form
          onSubmit={onGenerate}
          aria-busy={generating}
          className={`space-y-4 rounded-xl border bg-[var(--surface)] p-5 ${
            generating ? "border-[var(--accent)]/60 ring-1 ring-[var(--accent)]/25" : "border-[var(--border)]"
          }`}
        >
          <h2 className="text-lg font-medium">Client brief or job description</h2>

          {generating && (
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
                <p className="text-sm font-medium text-[var(--text)]">Generating cover letter</p>
                <p className="text-sm text-[var(--muted)]">{GENERATE_HINTS[genHintIndex]}</p>
                <p className="text-xs text-[var(--muted)]">Elapsed {genElapsed}s</p>
                <p className="text-xs text-[var(--faint)]">
                  Retries on rate limits run on the server (not shown one-by-one here). Long waits usually mean backoff
                  or a large brief.
                </p>
              </div>
            </div>
          )}

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={12}
            disabled={generating}
            placeholder="Paste the role description, requirements, and what the client wants built…"
            className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <label className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            Chunks to retrieve (optional)
            <input
              type="number"
              min={1}
              max={30}
              value={kChunks}
              disabled={generating}
              onChange={(e) => {
                const v = e.target.value;
                setKChunks(v === "" ? "" : Number(v));
              }}
              placeholder="default"
              className="w-24 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[var(--text)] disabled:opacity-50"
            />
          </label>
          <button
            type="submit"
            disabled={generating || query.trim().length < 10 || projectCount === 0}
            className="w-full rounded-lg border border-[var(--accent)] bg-[var(--accent-dim)] py-2.5 text-sm font-medium text-[var(--accent)] disabled:opacity-40"
          >
            {generating ? "Working…" : "Generate cover letter"}
          </button>
          {genErr && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--danger)]/45 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
            >
              <p>{genErr}</p>
              {/429|quota|rate limit/i.test(genErr) && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  The API may still be retrying on the server; if this persists, your free-tier daily quota may be
                  exhausted — check billing or try again later.
                </p>
              )}
            </div>
          )}
        </form>

        {hasDraft && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium">Draft</h2>
              {viewingHistoryId && (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--muted)]">
                  Saved entry ·{" "}
                  {formatHistoryDate(coverHistory.find((h) => h.id === viewingHistoryId)?.created_at ?? 0)}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="block min-w-0 flex-1 text-sm text-[var(--muted)]">
                  <span className="mb-1 block font-medium text-[var(--text)]">Version</span>
                  <select
                    value={activeVersionId ?? ""}
                    onChange={(e) => selectVersion(e.target.value)}
                    className="mt-1 w-full max-w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)] sm:max-w-md"
                    aria-label="Draft version"
                  >
                    {draftVersions.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        {versionMenuLabel(v, i + 1)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs text-[var(--muted)]">
                  {draftVersions.length} version{draftVersions.length === 1 ? "" : "s"} · AI refines add a new
                  version; manual saves call <strong className="text-[var(--text)]">Save as new version</strong>
                  {serverHistoryId
                    ? " (manual saves and AI refines update server history for this letter)."
                    : " (server sync after you Generate or Open from history)."}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!isDirty || editorValue.trim().length < 10 || savingManualVersion}
                  onClick={() => void saveManualVersion()}
                  className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-dim)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] disabled:opacity-40"
                >
                  {savingManualVersion ? "Saving…" : "Save as new version"}
                </button>
                <button
                  type="button"
                  disabled={!isDirty}
                  onClick={discardEditorEdits}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--danger)]/50 hover:text-[var(--danger)] disabled:opacity-40"
                >
                  Discard edits
                </button>
              </div>
              {isDirty && (
                <p className="mt-2 text-xs text-amber-200/80">
                  {markdownEditorOpen
                    ? "Unsaved edits — save or discard before switching version."
                    : "Unsaved edits in the markdown source — open Edit markdown to continue, or save / discard here."}
                </p>
              )}
            </div>

            <LetterDraft
              content={editorValue}
              markdownEditorOpen={markdownEditorOpen}
              onOpenMarkdownEditor={() => setMarkdownEditorOpen(true)}
              onCloseMarkdownEditor={() => setMarkdownEditorOpen(false)}
              markdownDraftValue={editorValue}
              onMarkdownDraftChange={setEditorValue}
              markdownEditorDisabled={generating}
            />
            <RefineWithAi
              clientQuery={query}
              draft={editorValue}
              kChunks={kChunks}
              formBusy={generating}
              onApplied={(nextLetter, nextSources, meta) => {
                void (async () => {
                  const id = newId();
                  const note =
                    meta.instruction.length > 200
                      ? `${meta.instruction.slice(0, 200)}…`
                      : meta.instruction;
                  let highlightHistoryId: string | null = null;
                  if (serverHistoryId) {
                    try {
                      await patchCoverLetterHistory(serverHistoryId, nextLetter, {
                        versionSource: "refine",
                        refineNote: meta.instruction,
                        sources: nextSources,
                      });
                      await refresh();
                      highlightHistoryId = serverHistoryId;
                    } catch (e) {
                      alert(
                        e instanceof Error
                          ? `${e.message} — draft updated locally only.`
                          : "Could not save refine to server; draft updated locally only."
                      );
                    }
                  }
                  setDraftVersions((prev) => [
                    ...prev,
                    {
                      id,
                      createdAt: Date.now(),
                      source: "refine",
                      body: nextLetter,
                      refineNote: note,
                    },
                  ]);
                  setActiveVersionId(id);
                  setEditorValue(nextLetter);
                  setMarkdownEditorOpen(false);
                  setSources(nextSources);
                  setViewingHistoryId(highlightHistoryId);
                })();
              }}
            />
            {sources.length > 0 && (
              <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
                <summary className="cursor-pointer text-[var(--muted)]">Sources ({sources.length} chunks)</summary>
                <ul className="mt-3 space-y-3">
                  {sources.map((s, i) => (
                    <li
                      key={`${s.project_id}-${i}`}
                      className="border-t border-[var(--border)] pt-3 first:border-0 first:pt-0"
                    >
                      <p className="text-xs text-[var(--accent)]">
                        {s.project_name ?? s.project_id}
                        {s.page != null ? ` · page ${s.page}` : ""}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">{s.preview}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
