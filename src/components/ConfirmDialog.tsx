"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, primary button uses danger styling */
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const primaryDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-[101] w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/50"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight text-[var(--text)]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-hover)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              primaryDanger
                ? "border border-[var(--danger)]/50 bg-[var(--danger)]/15 text-[var(--danger)] hover:bg-[var(--danger)]/25"
                : "border border-[var(--accent)]/45 bg-[var(--accent-dim)] text-[var(--on-accent)] hover:brightness-[1.05]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
