/**
 * Small right-pointing arrow used inside buttons and inline links.
 * Inherits its color from the surrounding text via `currentColor`.
 */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="9"
      height="7"
      viewBox="0 0 9 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5.25 0.5L8.25 3.5L5.25 6.5M8.25 3.5H0.75"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
