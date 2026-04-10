let loggedApiBase = false;

const base = () => {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL?.trim()) ||
    "http://127.0.0.1:8000";
  const url = raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development" && !loggedApiBase) {
    loggedApiBase = true;
    console.info("[frontend] Backend API URL:", url);
  }
  return url;
};

export type ProjectSummary = {
  project_id: string;
  name: string;
  filename: string;
  chunks: number;
  pages: number;
  created_at: number;
};

export type ServerInfo = {
  /** Where cover letter sidebar history is stored */
  cover_letter_history_backend?: "mongodb" | "json_file";
  /** Where global + chat assistant rules are stored */
  assistant_rules_backend?: "mongodb" | "json_file";
  gemini_chat_model: string;
  gemini_embed_model: string;
  /** Server-side max attempts on 429 / quota (chat + embeddings) */
  gemini_max_retries?: number;
  /** Max seconds between retries (server caps API “retry in Xs” hints) */
  gemini_retry_cap_seconds?: number;
  pinecone_index: string;
  pinecone_namespace: string;
  chunk_size: number;
  chunk_overlap: number;
  default_rag_k: number;
};

export type SourceSnippet = {
  project_id: string;
  project_name: string | null;
  page: number | null;
  preview: string;
};

export async function fetchServerInfo(): Promise<ServerInfo> {
  const r = await fetch(`${base()}/server/info`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export type AssistantRules = {
  global_rules: string;
  chat_rules: string;
  updated_at: number;
};

export async function fetchAssistantRules(): Promise<AssistantRules> {
  const r = await fetch(`${base()}/assistant/rules`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function saveAssistantRules(payload: {
  global_rules: string;
  chat_rules: string;
}): Promise<AssistantRules> {
  const r = await fetch(`${base()}/assistant/rules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    let detail = await r.text();
    try {
      const j = JSON.parse(detail);
      detail = j.detail ?? detail;
    } catch {
      /* keep */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return r.json();
}

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const r = await fetch(`${base()}/projects`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export type IngestResult = {
  project_id: string;
  name: string;
  filename: string;
  pages: number;
  chunks: number;
};

export async function ingestProject(file: File, displayName: string): Promise<IngestResult> {
  const fd = new FormData();
  fd.append("file", file);
  if (displayName.trim()) fd.append("display_name", displayName.trim());
  const r = await fetch(`${base()}/projects/ingest`, { method: "POST", body: fd });
  if (!r.ok) {
    let detail = await r.text();
    try {
      const j = JSON.parse(detail);
      detail = j.detail ?? detail;
    } catch {
      /* keep raw */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return r.json() as Promise<IngestResult>;
}

export async function deleteProject(projectId: string): Promise<void> {
  const r = await fetch(`${base()}/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(await r.text());
}

export type CoverLetterHistorySummary = {
  id: string;
  created_at: number;
  query_preview: string;
  k: number | null;
};

export type CoverLetterHistoryVersion = {
  id: string;
  created_at: number;
  source: "generate" | "refine" | "manual";
  body: string;
  refine_note?: string | null;
};

export type CoverLetterHistoryDetail = {
  id: string;
  created_at: number;
  query: string;
  k: number | null;
  cover_letter: string;
  sources: SourceSnippet[];
  /** Version chain (persisted). Older APIs may omit — treat as single generate. */
  versions?: CoverLetterHistoryVersion[];
};

export async function generateCoverLetter(
  query: string,
  k?: number
): Promise<{ cover_letter: string; sources: SourceSnippet[]; history_id: string }> {
  const r = await fetch(`${base()}/generate/cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, k: k ?? null }),
  });
  if (!r.ok) {
    let detail = await r.text();
    try {
      const j = JSON.parse(detail);
      detail = j.detail ?? detail;
    } catch {
      /* keep */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return r.json();
}

export async function refineCoverLetter(body: {
  client_query: string;
  cover_letter: string;
  instruction: string;
  selection?: string | null;
  k?: number | null;
}): Promise<{ cover_letter: string; sources: SourceSnippet[] }> {
  const r = await fetch(`${base()}/generate/cover-letter/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_query: body.client_query,
      cover_letter: body.cover_letter,
      instruction: body.instruction,
      selection: body.selection?.trim() ? body.selection.trim() : null,
      k: body.k ?? null,
    }),
  });
  if (!r.ok) {
    let detail = await r.text();
    try {
      const j = JSON.parse(detail);
      detail = j.detail ?? detail;
    } catch {
      /* keep */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return r.json();
}

export async function fetchCoverLetterHistory(): Promise<CoverLetterHistorySummary[]> {
  const r = await fetch(`${base()}/cover-letters/history`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchCoverLetterHistoryEntry(id: string): Promise<CoverLetterHistoryDetail> {
  const r = await fetch(`${base()}/cover-letters/history/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteCoverLetterHistoryEntry(id: string): Promise<void> {
  const r = await fetch(`${base()}/cover-letters/history/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function patchCoverLetterHistory(
  entryId: string,
  coverLetter: string,
  opts?: {
    versionSource?: "manual" | "refine";
    refineNote?: string | null;
    sources?: SourceSnippet[] | null;
  }
): Promise<void> {
  const payload: Record<string, unknown> = {
    cover_letter: coverLetter,
    version_source: opts?.versionSource ?? "manual",
  };
  if (opts?.refineNote != null && opts.refineNote !== "") {
    payload.refine_note = opts.refineNote;
  }
  if (opts?.sources != null) {
    payload.sources = opts.sources;
  }
  const r = await fetch(`${base()}/cover-letters/history/${encodeURIComponent(entryId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    let detail = await r.text();
    try {
      const j = JSON.parse(detail);
      detail = j.detail ?? detail;
    } catch {
      /* keep */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
}
