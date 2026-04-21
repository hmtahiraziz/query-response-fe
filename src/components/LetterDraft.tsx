"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const darkMd: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-6 font-display text-xl font-semibold tracking-tight text-[var(--text)] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-lg font-semibold text-[var(--text)]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-4 text-base font-semibold text-[var(--text)]">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed text-[var(--text)] last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-[var(--text)]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-[var(--text)]">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[var(--text)]">{children}</strong>,
  em: ({ children }) => <em className="italic text-[var(--muted)]">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--accent)] underline decoration-[var(--accent)]/50 underline-offset-2 hover:decoration-[var(--accent)]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-[var(--accent)]/70 pl-3 text-[var(--muted)] italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-[var(--border)]" />,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full min-w-[16rem] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[var(--surface-hover)]">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-[var(--text)]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[var(--border)] px-3 py-2 text-[var(--muted)]">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-[var(--surface-hover)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--accent)]"
        {...props}
      >
        {children}
      </code>
    );
  },
};

type LetterDraftProps = {
  content: string;
  /** Edit markdown / Done editing next to Copy and PDF; optional textarea under the toolbar when open */
  markdownEditorOpen?: boolean;
  onOpenMarkdownEditor?: () => void;
  onCloseMarkdownEditor?: () => void;
  markdownDraftValue?: string;
  onMarkdownDraftChange?: (value: string) => void;
  markdownEditorDisabled?: boolean;
};

export default function LetterDraft({
  content,
  markdownEditorOpen = false,
  onOpenMarkdownEditor,
  onCloseMarkdownEditor,
  markdownDraftValue,
  onMarkdownDraftChange,
  markdownEditorDisabled = false,
}: LetterDraftProps) {
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  useEffect(() => {
    revokePreview();
  }, [content, revokePreview]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      alert("Could not copy to clipboard.");
    }
  }, [content]);

  const buildPreview = useCallback(async () => {
    setPdfBusy(true);
    try {
      revokePreview();
      const { buildCoverLetterPdfBlob } = await import("@/lib/coverLetterPdf");
      const blob = buildCoverLetterPdfBlob(content);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch {
      alert("Could not build PDF. Try copying the markdown instead.");
    } finally {
      setPdfBusy(false);
    }
  }, [content, revokePreview]);

  const downloadPdf = useCallback(() => {
    const url = previewUrlRef.current;
    if (!url) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${stamp}.pdf`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onCopy()}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)]/50"
        >
          {copyDone ? "Copied" : "Copy markdown"}
        </button>
        <button
          type="button"
          disabled={pdfBusy}
          onClick={() => void buildPreview()}
          className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-dim)] px-3 py-1.5 text-xs font-medium text-[var(--on-accent)] disabled:opacity-50"
        >
          {pdfBusy ? "Building PDF…" : previewUrl ? "Rebuild PDF preview" : "Build PDF preview"}
        </button>
        {onOpenMarkdownEditor && onCloseMarkdownEditor &&
          (markdownEditorOpen ? (
            <button
              type="button"
              onClick={onCloseMarkdownEditor}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)]/50"
            >
              Done editing
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenMarkdownEditor}
              className="rounded-lg border border-[var(--accent)]/45 bg-[var(--accent-dim)] px-3 py-1.5 text-xs font-medium text-[var(--on-accent)]"
            >
              Edit markdown
            </button>
          ))}
        {previewUrl && (
          <>
            <button
              type="button"
              onClick={downloadPdf}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)]/50"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={revokePreview}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--danger)]/50 hover:text-[var(--danger)]"
            >
              Close preview
            </button>
          </>
        )}
      </div>

      {markdownEditorOpen && onMarkdownDraftChange != null && markdownDraftValue != null && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]" htmlFor="cover-letter-md">
            Markdown source
          </label>
          <textarea
            id="cover-letter-md"
            value={markdownDraftValue}
            onChange={(e) => onMarkdownDraftChange(e.target.value)}
            rows={14}
            disabled={markdownEditorDisabled}
            spellCheck
            className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
            aria-label="Cover letter markdown"
          />
        </div>
      )}

      {previewUrl && (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-3 py-2">
            <p className="text-xs text-[var(--muted)]">PDF preview — use Download PDF to save a copy.</p>
          </div>
          <iframe
            title="Cover letter PDF preview"
            src={`${previewUrl}#view=FitH`}
            className="h-[min(72vh,720px)] w-full bg-[#1a1a1a]"
          />
        </div>
      )}

      <article className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={darkMd}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
