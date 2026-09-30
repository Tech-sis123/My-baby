import Link from "next/link"
import { Baby, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

/** Segmented control that switches the auth form between mother and doctor portals. */
export function RoleSwitch({
  role,
  basePath,
  nextPath,
}: {
  role: "mother" | "doctor"
  basePath: "/login" | "/signup"
  nextPath?: string | null
}) {
  const href = (value: "mother" | "doctor") =>
    `${basePath}?role=${value}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`

  const options = [
    { value: "mother" as const, label: "Mother", icon: Baby },
    { value: "doctor" as const, label: "Clinician", icon: Stethoscope },
  ]

  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--hairline)] bg-[var(--surface-sunken)] p-1" role="tablist">
      {options.map(option => {
        const Icon = option.icon
        const active = role === option.value
        return (
          <Link
            key={option.value}
            href={href(option.value)}
            replace
            role="tab"
            aria-selected={active}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium",
              active ? "bg-[var(--card)] text-white shadow-sm ring-1 ring-[var(--hairline)]" : "text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </Link>
        )
      })}
    </div>
  )
}
