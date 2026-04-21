let loggedApiBase = false;

/** Browser console: full error for debugging (LLM/API/network failures). */
export function logClientApiError(context: string, err: unknown, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) {
    console.error(`[frontend:api] ${context}`, meta, err);
  } else {
    console.error(`[frontend:api] ${context}`, err);
  }
}

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
  ai_summary: ProjectAISummary | null;
  summary_generated_at: number | null;
  /** Which API produced vectors in Pinecone for this upload */
  embedding_provider: "gemini" | "openai";
};

export type ProjectAISummary = {
  name: string;
  type: string[];
  problem: string;
  solution: string;
  project_brief: string;
  technical_depth: string;
  stack: string[];
  impact: string;
  talking_points: string[];
  live_link: string | null;
};

export type ServerInfo = {
  /** Where cover letter sidebar history is stored */
  cover_letter_history_backend?: "mongodb" | "json_file";
  /** Cover-letter assistant rules: shipped JSON in backend repo */
  assistant_rules_source?: "bundled_json";
  /** Where ingested project metadata (library list) is stored */
  projects_backend?: "mongodb" | "json_file";
  openai_chat_model: string;
  openai_embed_model: string;
  openai_embed_dimensions?: number;
  /** Server-side max attempts on 429 / quota (chat + embeddings) */
  openai_max_retries?: number;
  /** Max seconds between retries (server caps API “retry in Xs” hints) */
  openai_retry_cap_seconds?: number;
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

export type AssistantPolicy = {
  language: "none" | "uk" | "us";
  max_words: number | null;
  must_include: string[];
  must_not_include: string[];
};

export type GenerationCodeRules = {
  tone_and_voice: string[];
  composition: string[];
  factual_grounding: string[];
  formatting: string[];
};

export type AssistantRules = {
  source: "code";
  rules_path: string;
  version: number;
  policy: AssistantPolicy;
  generation: GenerationCodeRules;
  /** Full bundled rules payload (persona, hard_constraints, …) when returned by the API */
  bundle?: Record<string, unknown>;
};

export async function fetchAssistantRules(): Promise<AssistantRules> {
  const r = await fetch(`${base()}/assistant/rules`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
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
  ai_summary: ProjectAISummary | null;
  summary_generated_at: number | null;
  embedding_provider: "openai";
};

export type GenerateProjectSummaryResult = {
  project_id: string;
  ai_summary: ProjectAISummary;
  summary_generated_at: number;
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

export async function generateProjectSummary(projectId: string): Promise<GenerateProjectSummaryResult> {
  const r = await fetch(`${base()}/projects/${encodeURIComponent(projectId)}/summary`, {
    method: "POST",
  });
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
  return r.json() as Promise<GenerateProjectSummaryResult>;
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
  const url = `${base()}/generate/cover-letter`;
  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, k: k ?? null }),
    });
  } catch (err) {
    logClientApiError("generateCoverLetter: fetch failed (network or CORS)", err, { url });
    throw err;
  }
  if (!r.ok) {
    let detail = await r.text();
    try {
      const j = JSON.parse(detail);
      detail = j.detail ?? detail;
    } catch {
      /* keep */
    }
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    logClientApiError("generateCoverLetter: HTTP error", new Error(message), {
      url: r.url || url,
      status: r.status,
      statusText: r.statusText,
      detail,
    });
    throw new Error(message);
  }
  try {
    return await r.json();
  } catch (err) {
    logClientApiError("generateCoverLetter: invalid JSON body", err, { url: r.url || url, status: r.status });
    throw err;
  }
}

export async function refineCoverLetter(body: {
  client_query: string;
  cover_letter: string;
  instruction: string;
  selection?: string | null;
  k?: number | null;
}): Promise<{ cover_letter: string; sources: SourceSnippet[] }> {
  const url = `${base()}/generate/cover-letter/refine`;
  let r: Response;
  try {
    r = await fetch(url, {
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
  } catch (err) {
    logClientApiError("refineCoverLetter: fetch failed (network or CORS)", err, { url });
    throw err;
  }
  if (!r.ok) {
    let detail = await r.text();
    try {
      const j = JSON.parse(detail);
      detail = j.detail ?? detail;
    } catch {
      /* keep */
    }
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    logClientApiError("refineCoverLetter: HTTP error", new Error(message), {
      url: r.url || url,
      status: r.status,
      statusText: r.statusText,
      detail,
    });
    throw new Error(message);
  }
  try {
    return await r.json();
  } catch (err) {
    logClientApiError("refineCoverLetter: invalid JSON body", err, { url: r.url || url, status: r.status });
    throw err;
  }
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
