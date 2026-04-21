"use client";

import { useCallback, useEffect, useState } from "react";
import ServerInfoPanel from "@/components/ServerInfoPanel";
import { fetchServerInfo, type ServerInfo } from "@/lib/api";

export default function SettingsPage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadErr(null);
    try {
      setInfo(await fetchServerInfo());
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load settings");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 border-b border-[var(--border)] pb-5">
        <h1 className="headline text-2xl font-semibold tracking-tight sm:text-3xl">Configuration</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Runtime options reported by the API server: persistence backends, OpenAI models, vector index, and
          rate-limit retries. Assistant behavior is defined in bundled JSON in the backend repo — there is no separate
          rules tab.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <h2 className="text-base font-medium text-[var(--text)]">System configuration</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]"
          >
            Refresh
          </button>
        </div>
        <ServerInfoPanel info={info} loadErr={loadErr} variant="compose" />
      </section>
    </div>
  );
}
