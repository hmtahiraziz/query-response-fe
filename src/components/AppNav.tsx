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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-black/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="min-w-0 justify-self-start">
            <Link href="/" className="headline text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl">
              Portfolio Cover Letter
            </Link>
          </div>
          <div className="flex w-full justify-center justify-self-center md:w-auto">
            <nav className="flex flex-wrap justify-center gap-1 sm:gap-2" aria-label="Main">
              {links.map(({ href, label }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-[var(--accent-dim)] text-[var(--on-accent)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
