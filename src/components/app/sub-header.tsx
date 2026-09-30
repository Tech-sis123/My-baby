import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  backHref: string
  eyebrow?: ReactNode
  title: ReactNode
  actions?: ReactNode
  width?: "narrow" | "default" | "wide"
  className?: string
}

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
}

/** Header for focused, task-level pages (check-ins, forms, detail views). */
export function SubHeader({ backHref, eyebrow, title, actions, width = "default", className }: Props) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--hairline)] bg-[rgba(17,24,39,0.85)] backdrop-blur-md print:hidden",
        className
      )}
    >
      <div className={cn("mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6", WIDTHS[width])}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            prefetch={false}
            aria-label="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--hairline)] text-[var(--muted-foreground)] hover:border-slate-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 leading-tight">
            {eyebrow ? <p className="eyebrow truncate">{eyebrow}</p> : null}
            <h1 className="truncate text-[15px] font-semibold text-white">{title}</h1>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
