"use client";

import { useCallback, useEffect, useState } from "react";
import ServerInfoPanel from "@/components/ServerInfoPanel";
import { fetchServerInfo, type ServerInfo } from "@/lib/api";

function formatTime(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SettingsPage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoadErr(null);
    setRefreshing(true);
    try {
      setInfo(await fetchServerInfo());
      setLastUpdated(new Date());
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setInitialLoad(false);
      setRefreshing(false);
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
        {lastUpdated && !loadErr && (
          <p className="mt-3 text-xs text-[var(--faint)]">Last pulled from API · {formatTime(lastUpdated)}</p>
        )}
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <h2 className="text-base font-medium text-[var(--text)]">System configuration</h2>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => void refresh()}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {initialLoad && !loadErr ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading configuration">
            <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-[var(--border)]/60" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded bg-[var(--border)]/40" />
            <div className="h-4 w-5/6 max-w-md animate-pulse rounded bg-[var(--border)]/50" />
            <div className="h-4 w-1/2 max-w-sm animate-pulse rounded bg-[var(--border)]/35" />
          </div>
        ) : (
          <ServerInfoPanel info={info} loadErr={loadErr} variant="compose" />
        )}
      </section>
    </div>
  );
}
