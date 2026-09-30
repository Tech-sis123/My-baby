"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MedicalFooter } from "@/components/medical-footer"
import { AppHeader } from "@/components/app/app-header"
import {
  EmptyState,
  Notice,
  SeverityBadge,
  SeverityDot,
  StatTile,
  severityTone,
  toSeverity,
} from "@/components/app/status"
import { formatStage, getGestationalWeek, getBabyAgeDays } from "@/lib/utils"
import { getPregnancyTip, getBabyTip } from "@/lib/tips"
import type { Pregnancy, Child, Appointment, Flag } from "@/lib/supabase/types"
import {
  ArrowRight,
  Baby,
  BellRing,
  Bot,
  Calendar,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Lightbulb,
  Link2,
  Plus,
  Stethoscope,
} from "lucide-react"

interface Props {
  profileName: string
  email: string
  pregnancies: Pregnancy[]
  babyProfiles: Child[]
  appointments: Appointment[]
  flags: Flag[]
  lastCheckins: Record<string, string>
  latestStatus?: Record<string, { severity: string; message: string }>
  recentCheckins?: Array<{ id: string; subject_id: string; subject_type: string; created_at: string; severity?: string; message?: string }>
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatVisit(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString("en-NG", opts)
}

function LinkDoctorInline({
  subjectType,
  subjectId,
}: {
  subjectType: "pregnancy" | "child"
  subjectId: string
}) {
  const [code, setCode] = useState("")
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function linkDoctor() {
    if (!code.trim()) { setError("Enter the referral code first."); return }
    if (code.trim().length < 4) { setError("Code looks too short."); return }
    setLoading(true)
    setError("")
    setSuccess("")
    const supabase = createClient()
    const { data: doctor } = await supabase
      .from("doctors")
      .select("user_id")
      .eq("invite_code", code.trim().toUpperCase())
      .maybeSingle()

    if (!doctor) { setError("Referral code not found."); setLoading(false); return }

    const table = subjectType === "pregnancy" ? "pregnancies" : "children"
    const { error: updateError } = await supabase
      .from(table)
      .update({ linked_doctor_id: doctor.user_id })
      .eq("id", subjectId)

    if (updateError) { setError(updateError.message); setLoading(false); return }

    setSuccess("Doctor linked.")
    router.refresh()
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[13px] text-[var(--muted-foreground)]">
          <Stethoscope className="h-4 w-4 shrink-0" />
          No doctor linked — check-ins stay private to you.
        </p>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Link2 className="h-3.5 w-3.5" /> Link doctor
        </Button>
      </div>
    )
  }

  return (
    <div className="surface-sunken p-4">
      <label htmlFor={`code-${subjectId}`} className="text-[13px] font-medium text-slate-300">
        Doctor&apos;s referral code
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id={`code-${subjectId}`}
          placeholder="e.g. ADAEZE-2026"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="h-10 flex-1 font-mono uppercase tracking-wider"
          autoFocus
        />
        <Button size="sm" className="h-10" onClick={linkDoctor} disabled={loading}>
          {loading ? "Linking…" : "Link"}
        </Button>
        <Button size="sm" variant="ghost" className="h-10" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">Your doctor will see new check-ins as soon as you submit them.</p>
      {error && <p className="mt-2 text-xs font-medium text-red-400">{error}</p>}
      {success && <p className="mt-2 text-xs font-medium text-emerald-400">{success}</p>}
    </div>
  )
}

function GestationProgress({ week }: { week: number }) {
  const clamped = Math.min(40, Math.max(0, week))
  const trimester = clamped < 14 ? "1st trimester" : clamped < 28 ? "2nd trimester" : "3rd trimester"
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted-foreground)]">{trimester}</span>
        <span className="num text-slate-400">
          <span className="font-semibold text-slate-200">{clamped}</span> / 40 weeks
        </span>
      </div>
      <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--primary)]" style={{ width: `${(clamped / 40) * 100}%` }} />
        <div className="absolute inset-y-0 left-[35%] w-px bg-[var(--card)]" />
        <div className="absolute inset-y-0 left-[70%] w-px bg-[var(--card)]" />
      </div>
    </div>
  )
}

interface CareCardProps {
  kind: "pregnancy" | "child"
  id: string
  title: string
  subtitle: string
  linked: boolean
  lastCheckin?: string
  status?: { severity: string; message: string }
  tip: string
  week?: number
  animating: boolean
  actions: React.ReactNode
}

function CareCard({ kind, id, title, subtitle, linked, lastCheckin, status, tip, week, animating, actions }: CareCardProps) {
  const Icon = kind === "pregnancy" ? HeartPulse : Baby
  const severity = status ? toSeverity(status.severity) : null

  return (
    <article className="surface overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">{subtitle}</p>
              <h3 className="mt-0.5 truncate text-xl font-semibold text-white">{title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {lastCheckin ? `Checked in ${timeAgo(lastCheckin)}` : "No check-ins yet"}
                </span>
                {linked ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Stethoscope className="h-3.5 w-3.5" /> Doctor linked
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {severity ? <SeverityBadge severity={severity} className="hidden sm:inline-flex" /> : null}
            <div className="relative w-full sm:w-auto">
              <Link href={`/mother/checkin/${kind}/${id}`} className="block">
                <Button className="w-full sm:w-auto">
                  Check in <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {animating && (
                <span className="float-up pointer-events-none absolute -top-2 left-1/2 z-10 whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-[#111827] shadow-lg shadow-amber-500/30">
                  +1 check-in
                </span>
              )}
            </div>
          </div>
        </div>

        {typeof week === "number" ? (
          <div className="mt-5">
            <GestationProgress week={week} />
          </div>
        ) : null}

        {status && severity ? (
          <Notice tone={severityTone(severity)} className="mt-5">
            <span className="font-medium">Latest check-in:</span> {status.message}
          </Notice>
        ) : null}

        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-white/[0.03] px-3.5 py-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-sm leading-relaxed text-slate-300">
            <span className="font-medium text-slate-100">This week · </span>
            {tip}
          </p>
        </div>

        {!linked ? (
          <div className="mt-4">
            <LinkDoctorInline subjectType={kind} subjectId={id} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1 border-t border-[var(--hairline)] bg-black/10 px-3 py-2">{actions}</div>
    </article>
  )
}

const footerAction = "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white"

export function MotherHomeClient({
  profileName,
  email,
  pregnancies,
  babyProfiles,
  appointments,
  flags,
  lastCheckins,
  latestStatus = {},
  recentCheckins = [],
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [animatingId, setAnimatingId] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("checkinSuccess") === "true") {
      const subjectId = searchParams.get("subjectId")
      if (subjectId) {
        setAnimatingId(subjectId)
        setTimeout(() => setAnimatingId(null), 2000)
        router.replace("/mother/home", { scroll: false })
      }
    }
  }, [searchParams, router])

  const redFlags = flags.filter(f => f.severity === "red").length
  const yellowFlags = flags.filter(f => f.severity === "yellow").length
  const totalProfiles = pregnancies.length + babyProfiles.length
  const linkedSubjects = [...pregnancies, ...babyProfiles].filter(s => s.linked_doctor_id).length
  const hasPregnancy = pregnancies.length > 0
  const hasBaby = babyProfiles.length > 0
  const firstName = profileName.split(" ")[0]
  const nextVisit = appointments[0]

  const overview =
    hasPregnancy && hasBaby
      ? "You're tracking a pregnancy and your baby."
      : hasPregnancy
        ? "Here's how your pregnancy is going."
        : hasBaby
          ? "Here's how your baby is doing."
          : "Add your first care profile to unlock check-ins, weekly guidance, and doctor linking."

  async function endPregnancy(id: string) {
    if (!confirm("Mark this pregnancy as ended?")) return
    await supabase
      .from("pregnancies")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", id)
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <AppHeader role="mother" userName={profileName} userMeta={email} />

      <main className="page motion-rise py-8 sm:py-10">
        {/* Greeting */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-[28px]">Welcome back, {firstName}</h1>
            <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">{overview}</p>
          </div>
          {totalProfiles > 0 ? (
            <div className="flex gap-2">
              <Link href="/mother/onboarding?add=pregnancy" prefetch={false}>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Pregnancy</Button>
              </Link>
              <Link href="/mother/onboarding?add=baby" prefetch={false}>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Baby</Button>
              </Link>
            </div>
          ) : null}
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Care profiles" value={totalProfiles} icon={<ClipboardList className="h-4 w-4" />} />
          <StatTile
            label="Open alerts"
            value={redFlags + yellowFlags}
            icon={<BellRing className="h-4 w-4" />}
            tone={redFlags > 0 ? "red" : yellowFlags > 0 ? "yellow" : "green"}
            hint={redFlags + yellowFlags === 0 ? "Nothing to act on" : undefined}
          />
          <StatTile
            label="Doctor linked"
            value={`${linkedSubjects}/${totalProfiles}`}
            icon={<Stethoscope className="h-4 w-4" />}
          />
          <StatTile
            label="Next visit"
            value={nextVisit ? formatVisit(nextVisit.scheduled_at, { day: "numeric", month: "short" }) : "—"}
            icon={<CalendarDays className="h-4 w-4" />}
            hint={nextVisit ? nextVisit.title : "None scheduled"}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Care profiles */}
          <div className="space-y-4">
            {totalProfiles === 0 && (
              <div className="surface px-6 py-14 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Plus className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-white">Set up your first care profile</h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--muted-foreground)]">
                  Add a pregnancy or baby profile to start daily check-ins and connect with your doctor.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/mother/onboarding?add=pregnancy" prefetch={false}>
                    <Button className="w-full sm:w-auto"><HeartPulse className="h-4 w-4" /> Add pregnancy</Button>
                  </Link>
                  <Link href="/mother/onboarding?add=baby" prefetch={false}>
                    <Button variant="outline" className="w-full sm:w-auto"><Baby className="h-4 w-4" /> Add baby</Button>
                  </Link>
                </div>
              </div>
            )}

            {pregnancies.map(pregnancy => {
              const week = getGestationalWeek(pregnancy.due_date)
              return (
                <CareCard
                  key={pregnancy.id}
                  kind="pregnancy"
                  id={pregnancy.id}
                  title={formatStage("pregnancy", { due_date: pregnancy.due_date })}
                  subtitle={`Pregnancy · Due ${formatVisit(pregnancy.due_date, { day: "numeric", month: "short", year: "numeric" })}`}
                  linked={!!pregnancy.linked_doctor_id}
                  lastCheckin={lastCheckins[pregnancy.id]}
                  status={latestStatus[pregnancy.id]}
                  tip={getPregnancyTip(week)}
                  week={week}
                  animating={animatingId === pregnancy.id}
                  actions={
                    <>
                      <Link href={`/mother/brief/pregnancy/${pregnancy.id}`} prefetch={false} className={footerAction}>
                        <FileText className="h-3.5 w-3.5" /> Pre-visit brief
                      </Link>
                      <Link href={`/mother/delivery/${pregnancy.id}`} prefetch={false} className={footerAction}>
                        <Baby className="h-3.5 w-3.5" /> I had my baby
                      </Link>
                      <button onClick={() => endPregnancy(pregnancy.id)} className={`${footerAction} ml-auto text-slate-500`}>
                        Update (loss)
                      </button>
                    </>
                  }
                />
              )
            })}

            {babyProfiles.map(child => (
              <CareCard
                key={child.id}
                kind="child"
                id={child.id}
                title={formatStage("child", { birth_date: child.birth_date, name: child.name })}
                subtitle={`Baby · Born ${formatVisit(child.birth_date, { day: "numeric", month: "short", year: "numeric" })}`}
                linked={!!child.linked_doctor_id}
                lastCheckin={lastCheckins[child.id]}
                status={latestStatus[child.id]}
                tip={getBabyTip(getBabyAgeDays(child.birth_date))}
                animating={animatingId === child.id}
                actions={
                  <Link href={`/mother/brief/child/${child.id}`} prefetch={false} className={footerAction}>
                    <FileText className="h-3.5 w-3.5" /> Pre-visit brief
                  </Link>
                }
              />
            ))}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Upcoming visits */}
            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Upcoming visits</h2>
                <Link href="/mother/appointments" prefetch={false} className="text-xs font-medium text-[var(--primary)] hover:text-orange-300">
                  View all
                </Link>
              </div>
              {appointments.length === 0 ? (
                <EmptyState
                  className="py-6"
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="No upcoming visits"
                  action={
                    <Link href="/mother/appointments" prefetch={false}>
                      <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /> Add visit</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {appointments.map(apt => (
                    <li key={apt.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--surface-sunken)] ring-1 ring-[var(--hairline)]">
                        <span className="text-[9px] font-semibold uppercase text-[var(--primary)]">
                          {formatVisit(apt.scheduled_at, { month: "short" })}
                        </span>
                        <span className="num text-sm font-semibold leading-none text-white">
                          {formatVisit(apt.scheduled_at, { day: "numeric" })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{apt.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {formatVisit(apt.scheduled_at, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent check-ins */}
            <section className="surface p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Recent check-ins</h2>
              {recentCheckins.length > 0 ? (
                <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[3px] before:top-2 before:w-px before:bg-[var(--hairline)]">
                  {recentCheckins.map(checkin => {
                    const severity = toSeverity(checkin.severity)
                    const subjectName =
                      checkin.subject_type === "pregnancy"
                        ? "Pregnancy"
                        : babyProfiles.find(b => b.id === checkin.subject_id)?.name || "Baby"
                    return (
                      <li key={checkin.id} className="relative flex gap-3 pl-0">
                        <SeverityDot severity={severity} className="relative z-10 mt-1.5 ring-4 ring-[var(--card)]" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-100">
                            {subjectName}
                            <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">{timeAgo(checkin.created_at)}</span>
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[13px] text-[var(--muted-foreground)]">{checkin.message}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No check-ins recorded yet.</p>
              )}
            </section>

            {/* Assistant */}
            <Link href="/mother/ask" prefetch={false} className="surface group flex items-center gap-3.5 p-4 hover:border-[var(--primary-line)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Ask the care assistant</p>
                <p className="text-xs text-[var(--muted-foreground)]">Pregnancy, feeding, sleep and more</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white" />
            </Link>
          </aside>
        </div>
      </main>

      <MedicalFooter />
    </div>
  )
}
