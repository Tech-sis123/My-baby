import { Phone } from "lucide-react"

export function MedicalFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--hairline)] print:hidden">
      <div className="page flex flex-col gap-3 py-6 text-[13px] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-[var(--muted-foreground)]">
          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <span>
            <span className="font-medium text-slate-200">Urgent symptoms?</span> Call your doctor or go to the nearest hospital.
            My Baby supports follow-up care and is not an emergency service.
          </span>
        </p>
        <p className="shrink-0 text-xs text-slate-500">© {new Date().getFullYear()} My Baby</p>
      </div>
    </footer>
  )
}
