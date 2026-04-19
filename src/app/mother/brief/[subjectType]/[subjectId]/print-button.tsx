"use client"
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="ml-auto text-sm text-[var(--primary)] font-medium underline"
    >
      Print
    </button>
  )
}
