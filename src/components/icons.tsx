/** Small UI icons — stroke-based, inherits `currentColor`. */

export function ChevronRightIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={props.className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
