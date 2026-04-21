"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAssistantRules, type AssistantRules } from "@/lib/api";

function BulletList({ title, items }: { title: string; items: string[] }) {
  const filtered = items.map((s) => s.trim()).filter(Boolean);
  if (filtered.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--text)]">{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
        {filtered.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AssistantRulesPanel() {
  const [rules, setRules] = useState<AssistantRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    void fetchAssistantRules()
      .then(setRules)
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Could not load assistant rules");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">Assistant rules</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Rules are defined as JSON in the backend repository (
            <code className="rounded bg-black/25 px-1 py-0.5 font-mono text-xs">{rules?.rules_path ?? "app/rules/…"}</code>
            ). Edit that file and redeploy (or restart the API in dev) to change tone, composition, grounding, formatting,
            and structured policy. There is nothing to save from this screen.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
          Source: <span className="ml-1 text-[var(--text)]">bundled JSON</span>
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading rules…</p>
      ) : err ? (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          <p>{err}</p>
          <button
            type="button"
            onClick={() => load()}
            className="mt-3 rounded-md border border-[var(--danger)]/50 px-3 py-1.5 text-xs font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/15"
          >
            Retry
          </button>
        </div>
      ) : rules ? (
        <>
          <p className="text-xs text-[var(--faint)]">Bundle version: {rules.version}</p>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/40 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-[var(--text)]">Structured policy</h4>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Language</dt>
                <dd className="text-[var(--muted)]">{rules.policy.language}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Max words</dt>
                <dd className="text-[var(--muted)]">{rules.policy.max_words != null ? rules.policy.max_words : "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Must include</dt>
                <dd className="text-[var(--muted)]">
                  {rules.policy.must_include.length ? rules.policy.must_include.join(" · ") : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-[var(--faint)]">Must not include</dt>
                <dd className="text-[var(--muted)]">
                  {rules.policy.must_not_include.length ? rules.policy.must_not_include.join(" · ") : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/40 p-4 sm:p-5">
            <h4 className="text-sm font-semibold text-[var(--text)]">Generation rules</h4>
            <div className="space-y-5">
              <BulletList title="Tone and voice" items={rules.generation.tone_and_voice} />
              <BulletList title="Composition" items={rules.generation.composition} />
              <BulletList title="Factual grounding" items={rules.generation.factual_grounding} />
              <BulletList title="Formatting" items={rules.generation.formatting} />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
