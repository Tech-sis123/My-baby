"use client"

import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  active: boolean
  onClick: () => void
  label: string
  description?: string
  icon?: LucideIcon
  tone?: "default" | "alert"
  size?: "sm" | "md"
  className?: string
}

/** Selectable answer tile used across check-ins and onboarding forms. */
export function OptionTile({ active, onClick, label, description, icon: Icon, tone = "default", size = "md", className }: Props) {
  const activeCls =
    tone === "alert"
      ? "border-amber-500/60 bg-amber-500/[0.08] ring-1 ring-amber-500/30"
      : "border-[var(--primary)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary-line)]"

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-lg border text-left",
        size === "sm" ? "px-3.5 py-2.5" : "px-4 py-3.5",
        active ? activeCls : "border-[var(--border)] bg-[var(--surface-sunken)] hover:border-slate-500",
        className
      )}
    >
      {Icon ? (
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", active ? (tone === "alert" ? "text-amber-400" : "text-[var(--primary)]") : "text-slate-500")} />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={cn("block font-medium", size === "sm" ? "text-sm" : "text-[15px]", active ? "text-white" : "text-slate-300")}>
          {label}
        </span>
        {description ? <span className="mt-0.5 block text-[13px] text-[var(--muted-foreground)]">{description}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
          active
            ? tone === "alert"
              ? "border-amber-500 bg-amber-500 text-[#111827]"
              : "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-slate-600"
        )}
      >
        {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </button>
  )
}

/** A question block: label + helper text + answer grid. */
export function Question({
  title,
  hint,
  icon: Icon,
  children,
  className,
}: {
  title: string
  hint?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <fieldset className={cn("surface p-5 sm:p-6", className)}>
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300 ring-1 ring-[var(--hairline)]">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : null}
        <div>
          <p className="text-[15px] font-semibold text-white">{title}</p>
          {hint ? <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">{hint}</p> : null}
        </div>
      </div>
      <div role="radiogroup" aria-label={title}>{children}</div>
    </fieldset>
  )
}
