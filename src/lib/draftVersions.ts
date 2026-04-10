import type { CoverLetterHistoryDetail, CoverLetterHistoryVersion } from "@/lib/api";

export type DraftVersionSource = "generate" | "refine" | "manual";

export type DraftVersion = {
  id: string;
  createdAt: number;
  source: DraftVersionSource;
  body: string;
  /** Truncated refine instruction for UI */
  refineNote?: string;
};

/** Map API versions (created_at in seconds) to UI draft rows (createdAt in ms). */
export function draftVersionsFromApi(versions: CoverLetterHistoryVersion[]): DraftVersion[] {
  return versions.map((v) => ({
    id: v.id,
    createdAt: v.created_at < 1_000_000_000_000 ? v.created_at * 1000 : v.created_at,
    source: v.source,
    body: v.body,
    refineNote: v.refine_note ?? undefined,
  }));
}

export function detailToDraftVersions(
  d: Pick<CoverLetterHistoryDetail, "id" | "created_at" | "cover_letter" | "versions">
): DraftVersion[] {
  if (d.versions?.length) return draftVersionsFromApi(d.versions);
  return [
    {
      id: `${d.id}-legacy`,
      createdAt: d.created_at < 1_000_000_000_000 ? d.created_at * 1000 : d.created_at,
      source: "generate",
      body: d.cover_letter,
    },
  ];
}

export function versionMenuLabel(v: DraftVersion, indexOneBased: number): string {
  const t = new Date(v.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const kind =
    v.source === "generate" ? "Generated" : v.source === "refine" ? "AI refine" : "Manual save";
  const hint = v.refineNote
    ? ` — ${v.refineNote.length > 40 ? `${v.refineNote.slice(0, 40)}…` : v.refineNote}`
    : "";
  return `v${indexOneBased} · ${kind}${hint} · ${t}`;
}
