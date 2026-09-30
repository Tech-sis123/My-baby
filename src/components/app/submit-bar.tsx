import { ArrowRight, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Sticky footer for multi-question forms: progress + primary submit. */
export function SubmitBar({
  answered,
  total,
  disabled,
  submitting,
  label = "Submit check-in",
}: {
  answered: number
  total: number
  disabled: boolean
  submitting: boolean
  label?: string
}) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-[var(--hairline)] bg-[rgba(17,24,39,0.92)] px-4 py-4 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border sm:px-5">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[var(--muted-foreground)]">
            <span className="num font-semibold text-white">{answered}</span> of {total} required answered
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Button type="submit" disabled={disabled || submitting} className="shrink-0">
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Saving…" : label}
          {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </div>
    </div>
  )
}
