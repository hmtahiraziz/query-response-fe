"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Portfolio library" },
  { href: "/cover-letter", label: "Cover letter" },
  { href: "/settings", label: "Settings" },
] as const;

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/90 bg-[var(--bg)]/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex items-center justify-between gap-3 md:justify-start">
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--accent)]/35 bg-gradient-to-br from-[var(--accent-dim)] to-black/40 text-xs font-bold tracking-tight text-[var(--accent-soft)] shadow-inner shadow-black/40 transition group-hover:border-[var(--accent)]/55 group-hover:text-white"
                aria-hidden
              >
                PC
              </span>
              <span className="min-w-0">
                <span className="headline block truncate text-base font-semibold tracking-tight text-[var(--text)] sm:text-lg">
                  Portfolio Cover Letter
                </span>
                <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--faint)] sm:block">
                  RAG-backed proposals
                </span>
              </span>
            </Link>
          </div>

          <nav
            className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-[var(--border)]/80 bg-[var(--surface)]/50 p-1 sm:inline-flex sm:justify-end"
            aria-label="Main"
          >
            {links.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                    active
                      ? "text-white"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute inset-0 rounded-full bg-[var(--accent)]/35 ring-1 ring-[var(--accent)]/25"
                      aria-hidden
                    />
                  )}
                  <span className="relative z-[1]">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
