import type { ReactNode } from "react"
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react"
import { cn } from "@/lib/utils"

export type Severity = "red" | "yellow" | "green"

export function toSeverity(value: string | null | undefined): Severity {
  return value === "red" || value === "yellow" ? value : "green"
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  red: "Urgent",
  yellow: "Review soon",
  green: "Stable",
}

export const SEVERITY_TEXT: Record<Severity, string> = {
  red: "text-red-400",
  yellow: "text-amber-400",
  green: "text-emerald-400",
}

const DOT: Record<Severity, string> = {
  red: "bg-[var(--flag-red)] text-[var(--flag-red)]",
  yellow: "bg-[var(--flag-amber)] text-[var(--flag-amber)]",
  green: "bg-[var(--flag-green)] text-[var(--flag-green)]",
}

const BADGE: Record<Severity, string> = {
  red: "bg-red-500/10 text-red-300 ring-red-500/25",
  yellow: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
  green: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
}

export const SEVERITY_PANEL: Record<Severity, string> = {
  red: "border-red-500/25 bg-red-500/[0.06]",
  yellow: "border-amber-500/25 bg-amber-500/[0.06]",
  green: "border-emerald-500/20 bg-emerald-500/[0.05]",
}

export const SEVERITY_RAIL: Record<Severity, string> = {
  red: "before:bg-[var(--flag-red)]",
  yellow: "before:bg-[var(--flag-amber)]",
  green: "before:bg-[var(--flag-green)]",
}

export function SeverityDot({ severity, pulse, className }: { severity: Severity; pulse?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", DOT[severity], pulse && severity === "red" && "pulse-dot", className)}
    />
  )
}

export function SeverityBadge({ severity, label, className }: { severity: Severity; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        BADGE[severity],
        className
      )}
    >
      <SeverityDot severity={severity} className="h-1.5 w-1.5" />
      {label ?? SEVERITY_LABEL[severity]}
    </span>
  )
}

type Tone = "success" | "error" | "warning" | "info"

const NOTICE: Record<Tone, { cls: string; icon: typeof Info }> = {
  success: { cls: "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-200", icon: CheckCircle2 },
  error: { cls: "border-red-500/25 bg-red-500/[0.07] text-red-200", icon: OctagonAlert },
  warning: { cls: "border-amber-500/25 bg-amber-500/[0.07] text-amber-200", icon: AlertTriangle },
  info: { cls: "border-[var(--hairline)] bg-white/[0.03] text-slate-300", icon: Info },
}

export function Notice({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const { cls, icon: Icon } = NOTICE[tone]
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed", cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function severityTone(severity: Severity): Tone {
  return severity === "red" ? "error" : severity === "yellow" ? "warning" : "success"
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center", className)}>
      {icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[var(--muted-foreground)]">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-[13px] text-[var(--muted-foreground)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function StatTile({
  label,
  value,
  icon,
  tone = "neutral",
  hint,
  className,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: "neutral" | Severity | "primary"
  hint?: string
  className?: string
}) {
  const toneCls =
    tone === "red" ? "text-red-400" : tone === "yellow" ? "text-amber-400" : tone === "green" ? "text-emerald-400" : tone === "primary" ? "text-[var(--primary)]" : "text-slate-400"
  return (
    <div className={cn("surface p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="data-label">{label}</p>
        {icon ? <span className={toneCls}>{icon}</span> : null}
      </div>
      <p className={cn("num mt-2 text-2xl font-semibold sm:text-[28px]", tone !== "neutral" && tone !== "primary" && value !== 0 ? toneCls : "text-white")}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{hint}</p> : null}
    </div>
  )
}

export function SectionHeading({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          {icon ? <span className="text-[var(--muted-foreground)]">{icon}</span> : null}
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function DataField({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("surface-sunken px-3 py-2.5", className)}>
      <p className="data-label">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-slate-100">{value}</p>
    </div>
  )
}
