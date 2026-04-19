import Link from "next/link"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  CalendarClock,
  HeartPulse,
  Phone,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserRound,
} from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import type { Appointment } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/server"
import { formatStage } from "@/lib/utils"
import { ScheduleCallbackForm } from "./callback-form"

type Severity = "red" | "yellow" | "green"

type SubjectRecord = {
  mother_id: string
  due_date?: string | null
  birth_date?: string | null
  name?: string | null
  gender?: string | null
  status?: string | null
}

type CheckinRow = {
  id: string
  created_at: string
  payload: Record<string, unknown> | null
}

type FlagRow = {
  checkin_id: string
  severity: string
  message: string
  rule_id: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatAppointmentDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getSeverity(flags: FlagRow[]): Severity {
  if (flags.some(flag => flag.severity === "red")) return "red"
  if (flags.some(flag => flag.severity === "yellow")) return "yellow"
  return "green"
}

function severityBadge(severity: Severity): string {
  if (severity === "red") return "border-red-400/30 bg-red-500/12 text-red-100"
  if (severity === "yellow") return "border-yellow-400/30 bg-yellow-500/12 text-yellow-100"
  return "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
}

function severityPanel(severity: Severity): string {
  if (severity === "red") return "border-red-400/22 bg-red-500/8"
  if (severity === "yellow") return "border-yellow-400/22 bg-yellow-500/8"
  return "border-emerald-400/22 bg-emerald-500/8"
}

function severityDot(severity: Severity): string {
  if (severity === "red") return "bg-red-400"
  if (severity === "yellow") return "bg-yellow-400"
  return "bg-emerald-400"
}

function severityLabel(severity: Severity): string {
  if (severity === "red") return "Immediate attention"
  if (severity === "yellow") return "Review soon"
  return "Stable watch"
}

function payloadDetails(subjectType: string, payload: Record<string, unknown> | null) {
  if (!payload) return []

  const details: Array<{ label: string; value: string }> = []

  if (subjectType === "pregnancy") {
    if (payload.feeling != null) {
      details.push({
        label: "How she feels",
        value: String(payload.feeling).replaceAll("_", " "),
      })
    }
    if (payload.bleeding != null) {
      details.push({ label: "Bleeding", value: Boolean(payload.bleeding) ? "Yes" : "No" })
    }
    if (payload.severe_headache != null) {
      details.push({ label: "Severe headache", value: Boolean(payload.severe_headache) ? "Yes" : "No" })
    }
    if (payload.swelling != null) {
      details.push({ label: "Swelling", value: Boolean(payload.swelling) ? "Yes" : "No" })
    }
    if (payload.fetal_movement != null) {
      details.push({ label: "Fetal movement", value: Boolean(payload.fetal_movement) ? "Present" : "Reduced / absent" })
    }
    if (payload.bp_systolic != null) {
      details.push({
        label: "Blood pressure",
        value: `${String(payload.bp_systolic)}/${String(payload.bp_diastolic ?? "?")} mmHg`,
      })
    }
  } else {
    if (payload.feeding != null) {
      details.push({
        label: "Feeding",
        value: String(payload.feeding).replaceAll("_", " "),
      })
    }
    if (payload.wet_diapers_24h != null) {
      details.push({
        label: "Wet diapers",
        value: `${String(payload.wet_diapers_24h)} in 24h`,
      })
    }
    if (payload.fever != null) {
      details.push({ label: "Fever", value: Boolean(payload.fever) ? "Yes" : "No" })
    }
    if (payload.temp != null) {
      details.push({ label: "Temperature", value: `${String(payload.temp)}°C` })
    }
    if (payload.breathing_normal != null) {
      details.push({
        label: "Breathing",
        value: Boolean(payload.breathing_normal) ? "Normal" : "Needs review",
      })
    }
    if (payload.mother_mood != null) {
      details.push({
        label: "Mother mood",
        value: String(payload.mother_mood).replaceAll("_", " "),
      })
    }
  }

  return details
}

function latestSummary(
  subjectType: string,
  payload: Record<string, unknown> | null,
  latestFlags: FlagRow[],
  stage: string
) {
  const bullets: string[] = []

  if (latestFlags.length > 0) {
    bullets.push(latestFlags[0].message)
  }

  if (subjectType === "pregnancy") {
    bullets.push(`Current track: ${stage}.`)

    if (payload?.feeling != null) {
      bullets.push(`Mother reports feeling ${String(payload.feeling).replaceAll("_", " ")}.`)
    }
    if (payload?.bp_systolic != null) {
      bullets.push(`Last blood pressure entered was ${String(payload.bp_systolic)}/${String(payload.bp_diastolic ?? "?")} mmHg.`)
    }
    if (typeof payload?.note === "string" && payload.note.length > 0) {
      bullets.push(`Latest note: "${String(payload.note)}"`)
    }
  } else {
    bullets.push(`Current track: ${stage}.`)

    if (payload?.feeding != null) {
      bullets.push(`Baby is currently on ${String(payload.feeding).replaceAll("_", " ")}.`)
    }
    if (payload?.wet_diapers_24h != null) {
      bullets.push(`Wet diaper count recorded: ${String(payload.wet_diapers_24h)} in 24 hours.`)
    }
    if (payload?.mother_mood != null) {
      bullets.push(`Mother mood recorded as ${String(payload.mother_mood).replaceAll("_", " ")}.`)
    }
    if (typeof payload?.note === "string" && payload.note.length > 0) {
      bullets.push(`Latest note: "${String(payload.note)}"`)
    }
  }

  return bullets.slice(0, 4)
}

function MetricCard({
  label,
  value,
  note,
  icon,
  accent,
}: {
  label: string
  value: string | number
  note: string
  icon: ReactNode
  accent: string
}) {
  return (
    <div className={`rounded-[1.35rem] border p-4 ${accent}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em]">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{note}</p>
    </div>
  )
}

export default async function DoctorPatientPage({
  params,
}: {
  params: Promise<{ subjectType: string; subjectId: string }>
}) {
  const { subjectType, subjectId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  let subjectRow: SubjectRecord | null = null

  if (subjectType === "pregnancy") {
    const { data } = await supabase.from("pregnancies").select("*").eq("id", subjectId).single()
    subjectRow = data as SubjectRecord | null
  } else {
    const { data } = await supabase.from("children").select("*").eq("id", subjectId).single()
    subjectRow = data as SubjectRecord | null
  }

  if (!subjectRow) redirect("/doctor/dashboard")

  const motherId = subjectRow.mother_id

  const [{ data: mother }, { data: checkins }, { data: appointments }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", motherId).single(),
    supabase
      .from("checkins")
      .select("id, created_at, payload")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", user.id)
      .eq("subject_type", subjectType)
      .eq("subject_id", subjectId)
      .order("scheduled_at", { ascending: true })
      .limit(10),
  ])

  const checkinRows = (checkins || []) as CheckinRow[]
  const checkinIds = checkinRows.map(checkin => checkin.id)
  const flagsByCheckin: Record<string, FlagRow[]> = {}

  if (checkinIds.length > 0) {
    const { data: allFlags } = await supabase
      .from("flags")
      .select("checkin_id, severity, message, rule_id")
      .in("checkin_id", checkinIds)

    for (const flag of (allFlags || []) as FlagRow[]) {
      if (!flagsByCheckin[flag.checkin_id]) flagsByCheckin[flag.checkin_id] = []
      flagsByCheckin[flag.checkin_id].push(flag)
    }
  }

  const stage =
    subjectType === "pregnancy"
      ? formatStage("pregnancy", { due_date: subjectRow.due_date || "" })
      : formatStage("child", { birth_date: subjectRow.birth_date || "", name: subjectRow.name || "Baby" })

  const latestCheckin = checkinRows[0] || null
  const latestFlags = latestCheckin ? flagsByCheckin[latestCheckin.id] || [] : []
  const overallSeverity = getSeverity(latestFlags)
  const lastUpdate = latestCheckin?.created_at || null
  const redCount = checkinRows.filter(checkin => getSeverity(flagsByCheckin[checkin.id] || []) === "red").length
  const yellowCount = checkinRows.filter(checkin => getSeverity(flagsByCheckin[checkin.id] || []) === "yellow").length
  const notesCount = checkinRows.filter(
    checkin => typeof checkin.payload?.note === "string" && checkin.payload.note.length > 0
  ).length
  const appointmentRows = (appointments || []) as Appointment[]
  const upcomingAppointments = appointmentRows.filter(appointment => appointment.scheduled_at >= new Date().toISOString())
  const careSummary = latestSummary(subjectType, latestCheckin?.payload || null, latestFlags, stage)

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/dashboard"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Doctor patient workspace</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">{mother?.full_name || "Linked patient"}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/doctor/ask?subjectType=${subjectType}&subjectId=${subjectId}`}>
              <span className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-4 text-sm font-semibold text-white transition hover:border-[rgba(201,139,88,0.34)]">
                <Bot className="h-4 w-4" /> Ask AI about case
              </span>
            </Link>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${severityBadge(overallSeverity)}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${severityDot(overallSeverity)}`} />
              {severityLabel(overallSeverity)}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <section className="panel-float overflow-hidden rounded-[2.25rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                <Stethoscope className="h-3.5 w-3.5" /> Linked care case review
              </div>

              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {subjectType === "pregnancy" ? "Pregnancy" : "Baby"} case context stays visible while you triage and follow up.
              </h2>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)]">
                <span>{stage}</span>
                <span>· {subjectType === "pregnancy" ? "Pregnancy monitoring" : "Baby monitoring"}</span>
                {mother?.phone ? <span>· {mother.phone}</span> : null}
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                This page should feel like the inside of a working clinical product: current status, recent signals, callback planning, and patient history all remain visible in one place.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Latest status"
                  value={severityLabel(overallSeverity)}
                  note={lastUpdate ? `Latest check-in came in ${timeAgo(lastUpdate)}.` : "No check-in submitted yet."}
                  icon={overallSeverity === "red" ? <Siren className="h-4 w-4 text-red-200" /> : overallSeverity === "yellow" ? <AlertTriangle className="h-4 w-4 text-yellow-100" /> : <ShieldCheck className="h-4 w-4 text-emerald-100" />}
                  accent={severityPanel(overallSeverity)}
                />
                <MetricCard
                  label="Check-ins"
                  value={checkinRows.length}
                  note={`Recent updates loaded into this care timeline, including ${yellowCount} yellow reviews.`}
                  icon={<Activity className="h-4 w-4 text-[var(--foreground)]" />}
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                />
                <MetricCard
                  label="Red reviews"
                  value={redCount}
                  note="Past check-ins in this history that were flagged urgent."
                  icon={<HeartPulse className="h-4 w-4 text-red-200" />}
                  accent="border-red-400/22 bg-red-500/8 text-red-100"
                />
                <MetricCard
                  label="Booked callbacks"
                  value={appointmentRows.length}
                  note={upcomingAppointments.length > 0 ? `${upcomingAppointments.length} still upcoming.` : "No callback booked yet."}
                  icon={<CalendarClock className="h-4 w-4 text-[var(--foreground)]" />}
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                />
              </div>
            </div>

            <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
              <div className="rounded-[1.65rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <UserRound className="h-4 w-4" /> Case identity
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Mother</p>
                    <p className="mt-2 text-lg font-semibold text-white">{mother?.full_name || "Linked mother"}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <Phone className="h-4 w-4" />
                      <span>{mother?.phone || "No phone on file yet"}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Care track</p>
                      <p className="mt-2 text-base font-semibold text-white">
                        {subjectType === "pregnancy" ? "Pregnancy track" : "Baby track"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{stage}</p>
                    </div>

                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Case notes</p>
                      <p className="mt-2 text-base font-semibold text-white">{notesCount}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        Check-ins that included written context from the mother.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-4 rounded-[1.65rem] border p-5 ${severityPanel(overallSeverity)}`}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <HeartPulse className="h-4 w-4" /> Clinical snapshot
                </div>
                <div className="mt-4 space-y-3">
                  {careSummary.length > 0 ? (
                    careSummary.map(line => (
                      <div key={line} className="rounded-[1.1rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white">
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.1rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white">
                      No check-in has been submitted on this track yet. Once the mother completes a check-in, the latest signals will appear here first.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">Timeline</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">Recent check-in history</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                    Each entry keeps its warning level, structured answers, and free-text note so you can review the patient story quickly.
                  </p>
                </div>
                <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                  {checkinRows.length > 0 ? `${checkinRows.length} recent entries` : "Awaiting first check-in"}
                </div>
              </div>

              {checkinRows.length === 0 ? (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-6 text-sm leading-6 text-[var(--muted-foreground)]">
                  No check-in has been recorded on this track yet. The linkage is active, but the doctor side still needs a first patient update before alerts and timeline data can appear here.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {checkinRows.map(checkin => {
                    const flags = flagsByCheckin[checkin.id] || []
                    const severity = getSeverity(flags)
                    const details = payloadDetails(subjectType, checkin.payload)
                    const note = typeof checkin.payload?.note === "string" ? checkin.payload.note : null

                    return (
                      <div key={checkin.id} className={`rounded-[1.65rem] border p-5 ${severityPanel(severity)}`}>
                        <div className="flex flex-col gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${severityDot(severity)}`} />
                              <p className="text-lg font-semibold text-white">{formatDateTime(checkin.created_at)}</p>
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                              Logged {timeAgo(checkin.created_at)} on the {subjectType === "pregnancy" ? "pregnancy" : "baby"} track.
                            </p>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${severityBadge(severity)}`}>
                            {severityLabel(severity)}
                          </span>
                        </div>

                        {flags.length > 0 ? (
                          <div className="mt-4 space-y-2">
                            {flags.map(flag => (
                              <div
                                key={`${checkin.id}-${flag.rule_id}`}
                                className={`rounded-[1.1rem] border px-4 py-3 text-sm leading-6 ${
                                  flag.severity === "red"
                                    ? "border-red-400/25 bg-red-500/12 text-red-100"
                                    : "border-yellow-400/25 bg-yellow-500/12 text-yellow-100"
                                }`}
                              >
                                {flag.message}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {details.length > 0 ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {details.map(detail => (
                              <div
                                key={`${checkin.id}-${detail.label}`}
                                className="rounded-[1.15rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(42,34,28,0.35)] p-4"
                              >
                                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                                  {detail.label}
                                </p>
                                <p className="mt-2 text-sm font-medium capitalize text-white">{detail.value}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {note ? (
                          <div className="mt-4 rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(42,34,28,0.35)] p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Mother note</p>
                            <p className="mt-2 text-sm leading-6 text-white">{note}</p>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </section>

          <aside className="space-y-6">
            <ScheduleCallbackForm
              motherId={motherId}
              doctorId={user.id}
              subjectType={subjectType}
              subjectId={subjectId}
            />

            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <CalendarClock className="h-4 w-4" /> Callback schedule
              </div>

              <div className="mt-5 space-y-3">
                {appointmentRows.length > 0 ? (
                  appointmentRows.map(appointment => {
                    const isUpcoming = appointment.scheduled_at >= new Date().toISOString()

                    return (
                      <div
                        key={appointment.id}
                        className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-semibold text-white">{appointment.title}</p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
                              isUpcoming
                                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                                : "border-[var(--border)] bg-[rgba(255,248,239,0.06)] text-[var(--muted-foreground)]"
                            }`}
                          >
                            {isUpcoming ? "Upcoming" : "Past"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{formatAppointmentDate(appointment.scheduled_at)}</p>
                        {appointment.notes ? (
                          <p className="mt-3 text-sm leading-6 text-white">{appointment.notes}</p>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                            No scheduling notes added.
                          </p>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-[1.35rem] border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                    No callback has been booked for this patient track yet. Use the planner above to keep follow-up explicit.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <MedicalFooter />
    </div>
  )
}
