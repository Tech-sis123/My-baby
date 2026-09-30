import Link from "next/link"
import { HeartPulse } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white",
        className
      )}
    >
      <HeartPulse className="h-[18px] w-[18px]" strokeWidth={2.25} />
    </span>
  )
}

export function Brand({ href = "/", tagline }: { href?: string; tagline?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <BrandMark />
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-white">My Baby</span>
        {tagline ? <span className="block text-[11px] text-[var(--muted-foreground)]">{tagline}</span> : null}
      </span>
    </Link>
  )
}
