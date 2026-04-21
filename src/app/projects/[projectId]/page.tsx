"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  deleteProject,
  fetchProjects,
  generateProjectSummary,
  type ProjectSummary,
} from "@/lib/api";
import { formatHistoryDate } from "@/lib/format";

function SummaryFields({ project }: { project: ProjectSummary }) {
  const s = project.ai_summary;
  if (!s) return null;
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-base font-semibold text-[var(--text)]">AI summary</h2>
      {project.summary_generated_at != null ? (
        <p className="mt-1 text-xs text-[var(--faint)]">
          Generated {formatHistoryDate(project.summary_generated_at)}
        </p>
      ) : null}
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Name</dt>
          <dd className="text-[var(--text)]">{s.name || project.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Type</dt>
          <dd className="text-[var(--muted)]">{s.type.length > 0 ? s.type.join(", ") : "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Problem</dt>
          <dd className="whitespace-pre-wrap text-[var(--muted)]">{s.problem || "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Solution</dt>
          <dd className="whitespace-pre-wrap text-[var(--muted)]">{s.solution || "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Project brief</dt>
          <dd className="whitespace-pre-wrap text-[var(--muted)]">{s.project_brief || "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Technical depth</dt>
          <dd className="whitespace-pre-wrap text-[var(--muted)]">{s.technical_depth || "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Stack</dt>
          <dd className="text-[var(--muted)]">{s.stack.length > 0 ? s.stack.join(", ") : "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Impact</dt>
          <dd className="whitespace-pre-wrap text-[var(--muted)]">{s.impact || "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Talking points</dt>
          <dd className="text-[var(--muted)]">
            {s.talking_points.length > 0 ? s.talking_points.join(", ") : "n/a"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Live link</dt>
          <dd className="text-[var(--muted)]">
            {s.live_link ? (
              <a href={s.live_link} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                {s.live_link}
              </a>
            ) : (
              "n/a"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.projectId;
  const projectId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoadErr(null);
    try {
      const list = await fetchProjects();
      const found = list.find((p) => p.project_id === projectId) ?? null;
      setProject(found);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load project");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onGenerateSummary() {
    if (!projectId) return;
    setSummarizing(true);
    try {
      await generateProjectSummary(projectId);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setSummarizing(false);
    }
  }

  async function onDelete() {
    if (!projectId) return;
    if (!confirm("Remove this project from the library and Pinecone?")) return;
    setRemoving(true);
    try {
      await deleteProject(projectId);
      router.push("/projects");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setRemoving(false);
    }
  }

  if (!projectId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-[var(--muted)]">Invalid project link.</p>
        <Link href="/projects" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm text-[var(--muted)]">Loading project…</p>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm text-[var(--danger)]">{loadErr}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
        >
          Retry
        </button>
        <Link href="/projects" className="mt-4 block text-sm text-[var(--accent)] hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="headline text-xl font-semibold text-[var(--text)]">Project not found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          It may have been removed, or the link is outdated. OpenAI-indexed projects only appear here.
        </p>
        <Link href="/projects" className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/projects"
          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          ← Portfolio library
        </Link>
      </div>

      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="headline text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{project.name}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{project.filename}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--surface)] px-3 py-2">
            <dt className="text-xs text-[var(--faint)]">Pages</dt>
            <dd className="font-medium text-[var(--text)]">{project.pages}</dd>
          </div>
          <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--surface)] px-3 py-2">
            <dt className="text-xs text-[var(--faint)]">Chunks</dt>
            <dd className="font-medium text-[var(--text)]">{project.chunks}</dd>
          </div>
          <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--surface)] px-3 py-2">
            <dt className="text-xs text-[var(--faint)]">Embeddings</dt>
            <dd className="font-medium capitalize text-[var(--text)]">{project.embedding_provider}</dd>
          </div>
          <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--surface)] px-3 py-2">
            <dt className="text-xs text-[var(--faint)]">Added</dt>
            <dd className="font-medium text-[var(--text)]">{formatHistoryDate(project.created_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--faint)]">Project id</dt>
            <dd className="mt-1 break-all font-mono text-xs text-[var(--muted)]">{project.project_id}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onGenerateSummary()}
            disabled={summarizing}
            className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-dim)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition hover:brightness-[1.02] disabled:opacity-50"
          >
            {summarizing
              ? "Working…"
              : project.ai_summary
                ? "Regenerate AI summary"
                : "Generate AI summary"}
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={removing}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--danger)] hover:bg-red-500/5 hover:text-[var(--danger)] disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove from library"}
          </button>
        </div>
      </header>

      <div className="mt-8 space-y-6">
        {project.ai_summary ? (
          <SummaryFields project={project} />
        ) : (
          <section className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)]/40 px-5 py-8 text-center">
            <p className="text-sm text-[var(--muted)]">No AI summary yet.</p>
            <p className="mt-1 text-xs text-[var(--faint)]">
              Generate a structured summary from your PDF for cover-letter grounding and quick reference.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
