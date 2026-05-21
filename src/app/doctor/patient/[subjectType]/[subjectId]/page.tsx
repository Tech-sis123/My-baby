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
  Siren,
  ShieldCheck,
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
    if (payload.feeling != null) details.push({ label: "Feeling", value: String(payload.feeling).replaceAll("_", " ") })
    if (payload.bleeding != null) details.push({ label: "Bleeding", value: Boolean(payload.bleeding) ? "Yes" : "No" })
    if (payload.severe_headache != null) details.push({ label: "Severe headache", value: Boolean(payload.severe_headache) ? "Yes" : "No" })
    if (payload.swelling != null) details.push({ label: "Swelling", value: Boolean(payload.swelling) ? "Yes" : "No" })
    if (payload.fetal_movement != null) details.push({ label: "Fetal movement", value: Boolean(payload.fetal_movement) ? "Present" : "Reduced / absent" })
    if (payload.bp_systolic != null) details.push({ label: "Blood pressure", value: `${String(payload.bp_systolic)}/${String(payload.bp_diastolic ?? "?")} mmHg` })
  } else {
    if (payload.feeding != null) details.push({ label: "Feeding", value: String(payload.feeding).replaceAll("_", " ") })
    if (payload.wet_diapers_24h != null) details.push({ label: "Wet diapers", value: `${String(payload.wet_diapers_24h)} in 24h` })
    if (payload.fever != null) details.push({ label: "Fever", value: Boolean(payload.fever) ? "Yes" : "No" })
    if (payload.temp != null) details.push({ label: "Temperature", value: `${String(payload.temp)}°C` })
    if (payload.breathing_normal != null) details.push({ label: "Breathing", value: Boolean(payload.breathing_normal) ? "Normal" : "Needs review" })
    if (payload.mother_mood != null) details.push({ label: "Mother mood", value: String(payload.mother_mood).replaceAll("_", " ") })
  }

  return details
}

function StatPill({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon: ReactNode
  accent: string
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${accent}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.22em]">{label}</p>
        {icon}
      </div>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.88)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">
                {subjectType === "pregnancy" ? "Pregnancy" : "Baby"} · {stage}
              </p>
              <h1 className="text-base font-semibold text-white">{mother?.full_name || "Linked patient"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/doctor/ask?subjectType=${subjectType}&subjectId=${subjectId}`}>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 text-sm font-medium text-white transition hover:border-[rgba(201,139,88,0.34)]">
                <Bot className="h-3.5 w-3.5" /> Ask AI
              </span>
            </Link>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${severityBadge(overallSeverity)}`}>
              <span className={`h-2 w-2 rounded-full ${severityDot(overallSeverity)}`} />
              {severityLabel(overallSeverity)}
            </span>
          </div>
        </div>
      </header>

      {/* Identity + stats strip */}
      <div className="border-b border-[var(--border)] bg-[rgba(73,60,51,0.5)]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-px divide-x divide-[var(--border)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <Phone className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <span className="text-sm text-white">{mother?.phone || "No phone on file"}</span>
          </div>
          {[
            { label: "Check-ins", value: checkinRows.length, icon: <Activity className="h-3.5 w-3.5" /> },
            { label: "Red", value: redCount, icon: <HeartPulse className="h-3.5 w-3.5 text-red-200" /> },
            { label: "Yellow", value: yellowCount, icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-100" /> },
            { label: "Notes", value: notesCount, icon: <ShieldCheck className="h-3.5 w-3.5" /> },
            {
              label: "Last update",
              value: lastUpdate ? timeAgo(lastUpdate) : "None",
              icon: overallSeverity === "red" ? <Siren className="h-3.5 w-3.5 text-red-200" /> : <ShieldCheck className="h-3.5 w-3.5" />,
            },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2 px-4 py-3">
              <span className="text-[var(--muted-foreground)]">{stat.icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{stat.label}</p>
                <p className="text-sm font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 2xl:grid-cols-[1.2fr_0.8fr]">

        {/* Timeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Check-in timeline</p>
            <span className="text-xs text-[var(--muted-foreground)]">
              {checkinRows.length > 0 ? `${checkinRows.length} entries` : "Awaiting first check-in"}
            </span>
          </div>

          {checkinRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-6 text-sm leading-6 text-[var(--muted-foreground)]">
              No check-in has been recorded on this track yet.
            </div>
          ) : (
            checkinRows.map(checkin => {
              const flags = flagsByCheckin[checkin.id] || []
              const severity = getSeverity(flags)
              const details = payloadDetails(subjectType, checkin.payload)
              const note = typeof checkin.payload?.note === "string" ? checkin.payload.note : null

              return (
                <div key={checkin.id} className={`rounded-xl border p-4 ${severityPanel(severity)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${severityDot(severity)}`} />
                      <p className="text-sm font-semibold text-white">{formatDateTime(checkin.created_at)}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] ${severityBadge(severity)}`}>
                      {severityLabel(severity)}
                    </span>
                  </div>

                  {flags.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                      {flags.map(flag => (
                        <div
                          key={`${checkin.id}-${flag.rule_id}`}
                          className={`rounded-lg border px-3 py-2 text-xs leading-5 ${
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
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {details.map(detail => (
                        <div
                          key={`${checkin.id}-${detail.label}`}
                          className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(42,34,28,0.35)] px-3 py-2"
                        >
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{detail.label}</p>
                          <p className="mt-1 text-xs font-medium capitalize text-white">{detail.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {note ? (
                    <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(42,34,28,0.35)] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Mother note</p>
                      <p className="mt-1 text-xs leading-5 text-white">{note}</p>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatPill
              label="Status"
              value={severityLabel(overallSeverity)}
              icon={overallSeverity === "red" ? <Siren className="h-4 w-4 text-red-200" /> : overallSeverity === "yellow" ? <AlertTriangle className="h-4 w-4 text-yellow-100" /> : <ShieldCheck className="h-4 w-4 text-emerald-100" />}
              accent={severityPanel(overallSeverity)}
            />
            <StatPill
              label="Callbacks"
              value={appointmentRows.length}
              icon={<CalendarClock className="h-4 w-4 text-[var(--foreground)]" />}
              accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
            />
          </div>

          {/* Callback form */}
          <ScheduleCallbackForm
            motherId={motherId}
            doctorId={user.id}
            subjectType={subjectType}
            subjectId={subjectId}
          />

          {/* Callback schedule */}
          <section className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <CalendarClock className="h-3.5 w-3.5" /> Callbacks
            </div>
            <div className="mt-3 space-y-2">
              {appointmentRows.length > 0 ? (
                appointmentRows.map(appointment => {
                  const isUpcoming = appointment.scheduled_at >= new Date().toISOString()
                  return (
                    <div
                      key={appointment.id}
                      className="rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{appointment.title}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] ${
                            isUpcoming
                              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                              : "border-[var(--border)] text-[var(--muted-foreground)]"
                          }`}
                        >
                          {isUpcoming ? "Up" : "Past"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatAppointmentDate(appointment.scheduled_at)}</p>
                      {appointment.notes ? (
                        <p className="mt-2 text-xs leading-5 text-white">{appointment.notes}</p>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-3 text-xs text-[var(--muted-foreground)]">
                  No callback booked yet.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <MedicalFooter />
    </div>
  )
}
