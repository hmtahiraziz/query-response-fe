"use client";

import { useCallback, useState } from "react";
import { refineCoverLetter, type SourceSnippet } from "@/lib/api";

export type RefineAppliedMeta = {
  instruction: string;
};

type RefineWithAiProps = {
  clientQuery: string;
  draft: string;
  kChunks: number | "";
  formBusy: boolean;
  onApplied: (letter: string, sources: SourceSnippet[], meta: RefineAppliedMeta) => void;
};

export default function RefineWithAi({
  clientQuery,
  draft,
  kChunks,
  formBusy,
  onApplied,
}: RefineWithAiProps) {
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineErr, setRefineErr] = useState<string | null>(null);

  const applyRefinement = useCallback(async () => {
    const ins = instruction.trim();
    if (ins.length < 3) {
      setRefineErr("Describe what you want changed (at least a few words).");
      return;
    }
    if (!clientQuery.trim()) {
      setRefineErr("Client brief is empty — open a history entry or paste the brief again.");
      return;
    }
    setRefining(true);
    setRefineErr(null);
    try {
      const selection =
        typeof window !== "undefined" ? (window.getSelection()?.toString().trim() ?? "") : "";
      const kk = kChunks === "" ? undefined : Number(kChunks);
      const res = await refineCoverLetter({
        client_query: clientQuery,
        cover_letter: draft,
        instruction: ins,
        selection: selection.length > 0 ? selection.slice(0, 8000) : null,
        k: kk,
      });
      onApplied(res.cover_letter, res.sources, { instruction: ins });
    } catch (e) {
      setRefineErr(e instanceof Error ? e.message : "Refinement failed");
    } finally {
      setRefining(false);
    }
  }, [clientQuery, draft, instruction, kChunks, onApplied]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="text-base font-medium text-[var(--text)]">Refine with AI</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Ask for tone changes, shorter sections, stronger opening, or clearer wording. Optionally{" "}
        <strong className="font-medium text-[var(--text)]">highlight text in the preview</strong> below before
        clicking apply — the model will prioritize that passage. Portfolio context is retrieved again to keep
        claims grounded.
      </p>
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        rows={4}
        disabled={refining || formBusy}
        placeholder='e.g. "Make the opening warmer and shorter" · "Tighten the bullet about scalability" · "Sound more senior, less salesy"'
        className="mt-3 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={refining || formBusy || instruction.trim().length < 3}
          onClick={() => void applyRefinement()}
          className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-dim)] px-4 py-2 text-sm font-medium text-[var(--accent)] disabled:opacity-40"
        >
          {refining ? "Refining…" : "Apply refinement"}
        </button>
        {refining && (
          <span className="text-xs text-[var(--muted)]">Server may retry on rate limits (same as generate).</span>
        )}
      </div>
      {refineErr && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-[var(--danger)]/45 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]"
        >
          <p>{refineErr}</p>
          {/429|quota|rate limit/i.test(refineErr) && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              If quotas are tight, wait and try again — the backend retries automatically when Google asks for a
              delay.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
