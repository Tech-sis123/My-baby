export function MedicalFooter() {
  return (
    <footer className="mt-10 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(16,17,20,0.72)] px-4 py-5 backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl gap-4 text-center sm:grid-cols-[1.2fr_0.8fr] sm:items-center sm:text-left">
        <div>
          <p className="text-sm font-semibold text-white">Need urgent help?</p>
          <p className="mt-1 text-xs leading-6 text-[var(--muted-foreground)]">
            Call your doctor or go to the nearest hospital. My Baby supports follow-up and check-ins, but it is not emergency care.
          </p>
        </div>
        <div className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Maternal care platform
        </div>
      </div>
    </footer>
  )
}
