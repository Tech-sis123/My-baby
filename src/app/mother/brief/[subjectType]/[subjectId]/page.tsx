import Link from "next/link"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  Printer,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { createClient } from "@/lib/supabase/server"
import { formatStage } from "@/lib/utils"
import { PrintButton } from "./print-button"

type SubjectRecord = {
  id: string
  mother_id: string
  due_date?: string | null
  birth_date?: string | null
  name?: string | null
  gender?: string | null
  linked_doctor_id?: string | null
}

type FlagRow = {
  id: string
  severity: "red" | "yellow" | "green"
  message: string
  created_at: string
}

type CheckinRow = {
  id: string
  created_at: string
  payload: Record<string, unknown> | null
}

type AppointmentRow = {
  id: string
  title: string
  scheduled_at: string
  notes: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
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

function severityBadge(severity: FlagRow["severity"]): string {
  if (severity === "red") return "border-red-400/30 bg-red-500/12 text-red-100"
  if (severity === "yellow") return "border-yellow-400/30 bg-yellow-500/12 text-yellow-100"
  return "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
}

function topSeverity(flags: FlagRow[]): "red" | "yellow" | "green" {
  if (flags.some(flag => flag.severity === "red")) return "red"
  if (flags.some(flag => flag.severity === "yellow")) return "yellow"
  return "green"
}

function summaryItems(subjectType: string, payload: Record<string, unknown> | null) {
  if (!payload) return []

  const items: Array<{ label: string; value: string }> = []

  if (subjectType === "pregnancy") {
    if (payload.feeling != null) {
      items.push({ label: "Feeling", value: String(payload.feeling).replaceAll("_", " ") })
    }
    if (payload.bleeding != null) {
      items.push({ label: "Bleeding", value: Boolean(payload.bleeding) ? "Yes" : "No" })
    }
    if (payload.severe_headache != null) {
      items.push({ label: "Severe headache", value: Boolean(payload.severe_headache) ? "Yes" : "No" })
    }
    if (payload.swelling != null) {
      items.push({ label: "Swelling", value: Boolean(payload.swelling) ? "Yes" : "No" })
    }
    if (payload.fetal_movement != null) {
      items.push({ label: "Fetal movement", value: Boolean(payload.fetal_movement) ? "Present" : "Reduced / absent" })
    }
    if (payload.bp_systolic != null) {
      items.push({
        label: "Blood pressure",
        value: `${String(payload.bp_systolic)}/${String(payload.bp_diastolic ?? "?")} mmHg`,
      })
    }
  } else {
    if (payload.feeding != null) {
      items.push({ label: "Feeding", value: String(payload.feeding).replaceAll("_", " ") })
    }
    if (payload.wet_diapers_24h != null) {
      items.push({ label: "Wet diapers", value: `${String(payload.wet_diapers_24h)} in 24h` })
    }
    if (payload.fever != null) {
      items.push({ label: "Fever", value: Boolean(payload.fever) ? "Yes" : "No" })
    }
    if (payload.temp != null) {
      items.push({ label: "Temperature", value: `${String(payload.temp)}°C` })
    }
    if (payload.breathing_normal != null) {
      items.push({ label: "Breathing", value: Boolean(payload.breathing_normal) ? "Normal" : "Needs review" })
    }
    if (payload.mother_mood != null) {
      items.push({ label: "Mother mood", value: String(payload.mother_mood).replaceAll("_", " ") })
    }
  }

  return items
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

export default async function PreVisitBriefPage({
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

  let subject: SubjectRecord | null = null

  if (subjectType === "pregnancy") {
    const { data } = await supabase.from("pregnancies").select("*").eq("id", subjectId).single()
    subject = data as SubjectRecord | null
  } else {
    const { data } = await supabase.from("children").select("*").eq("id", subjectId).single()
    subject = data as SubjectRecord | null
  }

  if (!subject || subject.mother_id !== user.id) redirect("/mother/home")

  const stage =
    subjectType === "pregnancy"
      ? formatStage("pregnancy", { due_date: subject.due_date || "" })
      : formatStage("child", { birth_date: subject.birth_date || "", name: subject.name || "Baby" })

  const sevenDaysAgoDate = new Date()
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7)
  const sevenDaysAgo = sevenDaysAgoDate.toISOString()

  const [{ data: checkins }, { data: flags }, { data: doctor }, { data: appointments }] = await Promise.all([
    supabase
      .from("checkins")
      .select("id, created_at, payload")
      .eq("subject_id", subjectId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false }),
    supabase
      .from("flags")
      .select("id, severity, message, created_at")
      .eq("subject_id", subjectId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false }),
    subject.linked_doctor_id
      ? supabase.from("doctors").select("specialty, clinic_name").eq("user_id", subject.linked_doctor_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("appointments")
      .select("id, title, scheduled_at, notes")
      .eq("subject_type", subjectType)
      .eq("subject_id", subjectId)
      .order("scheduled_at", { ascending: true })
      .limit(3),
  ])

  const checkinRows = (checkins || []) as CheckinRow[]
  const activeFlags = (flags || []) as FlagRow[]
  const upcomingAppointments = ((appointments || []) as AppointmentRow[]).filter(
    appointment => appointment.scheduled_at >= new Date().toISOString()
  )
  const latestCheckin = checkinRows[0] || null
  const flagSeverity = topSeverity(activeFlags)

  return (
    <div className="min-h-screen pb-24 print:bg-white print:pb-0">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/mother/home"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Pre-visit brief</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">Bring the recent story into the visit</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--foreground)]">
              <Printer className="h-4 w-4" /> Printable summary
            </div>
            <PrintButton />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <section className="panel-float overflow-hidden rounded-[2.25rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)] print:rounded-none print:border-0 print:bg-white print:shadow-none">
          <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)] print:hidden">
                <FileText className="h-3.5 w-3.5" /> Visit-ready summary
              </div>

              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white print:mt-0 print:text-black sm:text-5xl">
                {stage}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)] print:text-slate-600">
                <span>{subjectType === "pregnancy" ? "Pregnancy track" : "Baby track"}</span>
                <span>· Generated {formatDate(new Date().toISOString())}</span>
                {doctor?.clinic_name ? <span>· Linked doctor: {doctor.clinic_name}</span> : null}
                {!doctor?.clinic_name && subject.linked_doctor_id ? <span>· Linked to doctor</span> : null}
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)] print:text-slate-700">
                This brief pulls together recent check-ins, active alerts, and the latest note so appointments do not start from scratch.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
                <MetricCard
                  label="Active alerts"
                  value={activeFlags.length}
                  note="Open issues still visible on this care track."
                  icon={flagSeverity === "red" ? <AlertTriangle className="h-4 w-4 text-red-200" /> : <ShieldCheck className="h-4 w-4 text-[var(--foreground)]" />}
                  accent={flagSeverity === "red" ? "border-red-400/22 bg-red-500/8 text-red-100" : "border-[var(--border)] bg-[rgba(255,248,239,0.08)]"}
                />
                <MetricCard
                  label="Recent check-ins"
                  value={checkinRows.length}
                  note="Entries from the last 7 days."
                  icon={<ClipboardList className="h-4 w-4 text-[var(--foreground)]" />}
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                />
                <MetricCard
                  label="Next visit"
                  value={upcomingAppointments.length > 0 ? formatDate(upcomingAppointments[0].scheduled_at) : "None"}
                  note="Upcoming appointment on this subject."
                  icon={<CalendarDays className="h-4 w-4 text-[var(--foreground)]" />}
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                />
                <MetricCard
                  label="Latest note"
                  value={typeof latestCheckin?.payload?.note === "string" && latestCheckin.payload.note.length > 0 ? "Included" : "None"}
                  note="Whether the latest check-in added written context."
                  icon={<HeartPulse className="h-4 w-4 text-[var(--foreground)]" />}
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                />
              </div>
            </div>

            <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0 print:border-slate-200 print:bg-white">
              <div className="rounded-[1.65rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5 print:rounded-none print:border-slate-200 print:bg-white">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)] print:text-slate-600">
                  <Stethoscope className="h-4 w-4" /> Visit snapshot
                </div>

                <div className="mt-5 space-y-3">
                  {activeFlags.length > 0 ? (
                    activeFlags.slice(0, 3).map(flag => (
                      <div
                        key={flag.id}
                        className={`rounded-[1.15rem] border px-4 py-3 text-sm leading-6 print:rounded-none ${severityBadge(flag.severity)}`}
                      >
                        {flag.message}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.15rem] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100 print:rounded-none print:border-slate-200 print:bg-white print:text-slate-700">
                      No active alert is open on this subject right now.
                    </div>
                  )}

                  {latestCheckin ? (
                    <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white print:rounded-none print:border-slate-200 print:bg-white print:text-slate-800">
                      Latest check-in: {formatDateTime(latestCheckin.created_at)}
                    </div>
                  ) : (
                    <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white print:rounded-none print:border-slate-200 print:bg-white print:text-slate-800">
                      No check-in was submitted in the last 7 days.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.14fr_0.86fr]">
          <section className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6 print:rounded-none print:border-slate-200 print:bg-white">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 print:border-slate-200 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)] print:text-slate-600">Check-ins</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white print:text-black">Last 7 days</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] print:text-slate-700">
                    This section is the core of the brief: recent entries, structured answers, and the latest written notes.
                  </p>
                </div>
                <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)] print:hidden">
                  {checkinRows.length} recent entries
                </div>
              </div>

              {checkinRows.length === 0 ? (
                <div className="mt-6 rounded-[1.4rem] border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-5 text-sm leading-6 text-[var(--muted-foreground)] print:rounded-none print:border-slate-200 print:bg-white print:text-slate-700">
                  No check-ins were recorded in the last 7 days for this subject.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {checkinRows.map(checkin => {
                    const details = summaryItems(subjectType, checkin.payload)
                    const note = typeof checkin.payload?.note === "string" ? checkin.payload.note : null

                    return (
                      <div
                        key={checkin.id}
                        className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5 print:rounded-none print:border-slate-200 print:bg-white"
                      >
                        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 print:border-slate-200 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-white print:text-black">{formatDateTime(checkin.created_at)}</p>
                            <p className="mt-1 text-sm text-[var(--muted-foreground)] print:text-slate-700">
                              {subjectType === "pregnancy" ? "Pregnancy" : "Baby"} check-in
                            </p>
                          </div>
                        </div>

                        {details.length > 0 ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {details.map(detail => (
                              <div
                                key={`${checkin.id}-${detail.label}`}
                                className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 print:rounded-none print:border-slate-200 print:bg-white"
                              >
                                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] print:text-slate-600">
                                  {detail.label}
                                </p>
                                <p className="mt-2 text-sm font-medium capitalize text-white print:text-slate-900">{detail.value}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {note ? (
                          <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 print:rounded-none print:border-slate-200 print:bg-white">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] print:text-slate-600">Note</p>
                            <p className="mt-2 text-sm leading-6 text-white print:text-slate-900">{note}</p>
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
            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6 print:rounded-none print:border-slate-200 print:bg-white">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)] print:text-slate-600">
                <CalendarDays className="h-4 w-4" /> Upcoming appointments
              </div>

              <div className="mt-5 space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 print:rounded-none print:border-slate-200 print:bg-white"
                    >
                      <p className="text-base font-semibold text-white print:text-black">{appointment.title}</p>
                      <p className="mt-2 text-sm text-[var(--muted-foreground)] print:text-slate-700">
                        {formatDateTime(appointment.scheduled_at)}
                      </p>
                      {appointment.notes ? (
                        <p className="mt-3 text-sm leading-6 text-white print:text-slate-900">{appointment.notes}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-4 text-sm leading-6 text-[var(--muted-foreground)] print:rounded-none print:border-slate-200 print:bg-white print:text-slate-700">
                    No upcoming appointment is linked to this subject right now.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6 print:rounded-none print:border-slate-200 print:bg-white">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)] print:text-slate-600">
                <Activity className="h-4 w-4" /> What to show during the visit
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] px-4 py-3 text-sm leading-6 text-white print:rounded-none print:border-slate-200 print:bg-white print:text-slate-900">
                  Use this page to quickly show the recent pattern instead of retelling every day from memory.
                </div>
                <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] px-4 py-3 text-sm leading-6 text-white print:rounded-none print:border-slate-200 print:bg-white print:text-slate-900">
                  Active alerts and the latest note are the most useful parts to point out first.
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <div className="print:hidden">
        <MedicalFooter />
      </div>
    </div>
  )
}
