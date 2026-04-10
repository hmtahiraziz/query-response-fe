import type { DraftVersion } from "@/lib/draftVersions";
import type { SourceSnippet } from "@/lib/api";

const KEY = "pclCoverLetterSession.v1";

export type PersistedCoverLetterSession = {
  serverHistoryId: string | null;
  viewingHistoryId: string | null;
  query: string;
  kChunks: number | "" | null;
  sources: SourceSnippet[];
  draftVersions: DraftVersion[];
  activeVersionId: string | null;
  editorValue: string;
};

export function loadCoverLetterSession(): PersistedCoverLetterSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedCoverLetterSession;
    if (!p || !Array.isArray(p.draftVersions) || p.draftVersions.length === 0) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveCoverLetterSession(p: PersistedCoverLetterSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota / private mode */
  }
}

export function clearCoverLetterSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
