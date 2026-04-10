"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAssistantRules, saveAssistantRules } from "@/lib/api";
import { formatHistoryDate } from "@/lib/format";

type AssistantRulesPanelProps = {
  /** From GET /server/info — where rules are persisted */
  storageBackend?: "mongodb" | "json_file";
};

export default function AssistantRulesPanel({ storageBackend }: AssistantRulesPanelProps) {
  const [globalRules, setGlobalRules] = useState("");
  const [chatRules, setChatRules] = useState("");
  const [updatedAt, setUpdatedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    void fetchAssistantRules()
      .then((d) => {
        setGlobalRules(d.global_rules);
        setChatRules(d.chat_rules);
        setUpdatedAt(d.updated_at);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Could not load assistant rules");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    setSaving(true);
    setSaveOk(false);
    setErr(null);
    try {
      const d = await saveAssistantRules({ global_rules: globalRules, chat_rules: chatRules });
      setGlobalRules(d.global_rules);
      setChatRules(d.chat_rules);
      setUpdatedAt(d.updated_at);
      setSaveOk(true);
      window.setTimeout(() => setSaveOk(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const storageLabel =
    storageBackend === "mongodb"
      ? "MongoDB"
      : storageBackend === "json_file"
        ? "Local file (server data/assistant_rules.json)"
        : "Server default";

  return (
    <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-[var(--accent)]">▸</span> Assistant rules
        <span className="ml-2 font-normal text-[var(--muted)]">· {storageLabel}</span>
      </summary>
      <div className="space-y-3 border-t border-[var(--border)] px-4 py-4">
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          These instructions are prepended into every <strong className="font-medium text-[var(--text)]">generate</strong>{" "}
          and <strong className="font-medium text-[var(--text)]">refine</strong> prompt.{" "}
          <span className="text-[var(--faint)]">Global</span> applies across all drafts;{" "}
          <span className="text-[var(--faint)]">Chat</span> is an additional block (e.g. tone, language, formatting).
        </p>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading rules…</p>
        ) : err ? (
          <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
            <p>{err}</p>
            <button
              type="button"
              onClick={() => load()}
              className="mt-2 text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-[var(--text)]">
              Global rules
              <textarea
                value={globalRules}
                onChange={(e) => setGlobalRules(e.target.value)}
                rows={4}
                placeholder="e.g. Always keep a professional but warm tone. Never invent client names or metrics."
                className="mt-1 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--text)]">
              Chat rules
              <textarea
                value={chatRules}
                onChange={(e) => setChatRules(e.target.value)}
                rows={4}
                placeholder="e.g. Prefer UK spelling. End with a short call-to-action."
                className="mt-1 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void onSave()}
                className="rounded-lg border border-[var(--accent)] bg-[var(--accent-dim)] px-4 py-2 text-sm font-medium text-[var(--accent)] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save rules"}
              </button>
              {updatedAt > 0 ? (
                <span className="text-xs text-[var(--muted)]">Last saved {formatHistoryDate(updatedAt)}</span>
              ) : null}
              {saveOk ? <span className="text-xs font-medium text-emerald-400/90">Saved</span> : null}
            </div>
          </>
        )}
      </div>
    </details>
  );
}
