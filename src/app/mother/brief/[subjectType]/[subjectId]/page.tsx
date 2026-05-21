import Link from "next/link"
import { redirect } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
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
      .eq("mother_id", user.id)
      .eq("subject_type", subjectType)
      .eq("subject_id", subjectId)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(3),
  ])

  const checkinRows = (checkins || []) as CheckinRow[]
  const activeFlags = (flags || []) as FlagRow[]
  const upcomingAppointments = (appointments || []) as AppointmentRow[]
  const latestCheckin = checkinRows[0] || null
  const flagSeverity = topSeverity(activeFlags)

  return (
    <div className="min-h-screen pb-24 print:bg-white print:pb-0">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.88)] px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/mother/home"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">Pre-visit brief</p>
              <h1 className="text-base font-semibold text-white">{stage}</h1>
            </div>
          </div>
          <PrintButton />
        </div>
      </header>

      {/* Quick-read summary strip */}
      <div className="border-b border-[var(--border)] bg-[rgba(73,60,51,0.5)] print:hidden">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap divide-x divide-[var(--border)]">
          {[
            {
              label: "Active alerts",
              value: activeFlags.length,
              tone: activeFlags.length > 0 && flagSeverity === "red" ? "text-red-100" : "text-white",
            },
            { label: "Check-ins (7d)", value: checkinRows.length, tone: "text-white" },
            {
              label: "Next visit",
              value: upcomingAppointments.length > 0 ? formatDate(upcomingAppointments[0].scheduled_at) : "None",
              tone: "text-white",
            },
            {
              label: "Doctor",
              value: doctor?.clinic_name || (subject.linked_doctor_id ? "Linked" : "None"),
              tone: "text-white",
            },
          ].map(stat => (
            <div key={stat.label} className="flex-1 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{stat.label}</p>
              <p className={`mt-0.5 text-sm font-semibold ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-6 2xl:grid-cols-[1.2fr_0.8fr] print:max-w-none print:px-0 print:py-0">

        {/* Check-in history */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)] print:text-slate-600">
              <ClipboardList className="h-3.5 w-3.5 print:hidden" /> Last 7 days
            </div>
            <span className="text-xs text-[var(--muted-foreground)] print:hidden">
              {checkinRows.length} entries
            </span>
          </div>

          {checkinRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-5 text-sm leading-6 text-[var(--muted-foreground)] print:border-slate-200 print:bg-white print:text-slate-700">
              No check-ins recorded in the last 7 days.
            </div>
          ) : (
            checkinRows.map(checkin => {
              const details = summaryItems(subjectType, checkin.payload)
              const note = typeof checkin.payload?.note === "string" ? checkin.payload.note : null

              return (
                <div
                  key={checkin.id}
                  className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4 print:rounded-none print:border-slate-200 print:bg-white"
                >
                  <p className="text-sm font-semibold text-white print:text-black">{formatDateTime(checkin.created_at)}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)] print:text-slate-600">
                    {subjectType === "pregnancy" ? "Pregnancy" : "Baby"} check-in
                  </p>

                  {details.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {details.map(detail => (
                        <div
                          key={`${checkin.id}-${detail.label}`}
                          className="rounded-lg border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-3 py-2 print:rounded-none print:border-slate-200 print:bg-white"
                        >
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] print:text-slate-600">
                            {detail.label}
                          </p>
                          <p className="mt-1 text-xs font-medium capitalize text-white print:text-slate-900">{detail.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {note ? (
                    <div className="mt-3 rounded-lg border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-3 py-2 print:rounded-none print:border-slate-200 print:bg-white">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] print:text-slate-600">Note</p>
                      <p className="mt-1 text-xs leading-5 text-white print:text-slate-900">{note}</p>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </section>

        {/* Sidebar: alerts + appointments */}
        <aside className="space-y-4 print:space-y-6">

          {/* Active alerts */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)] print:text-slate-600">
              <AlertTriangle className="h-3.5 w-3.5 print:hidden" /> Active alerts
            </div>
            <div className="space-y-2">
              {activeFlags.length > 0 ? (
                activeFlags.slice(0, 4).map(flag => (
                  <div
                    key={flag.id}
                    className={`rounded-xl border px-4 py-3 text-sm leading-6 print:rounded-none ${severityBadge(flag.severity)}`}
                  >
                    {flag.message}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100 print:rounded-none print:border-slate-200 print:bg-white print:text-slate-700">
                  No active alerts right now.
                </div>
              )}
            </div>
          </section>

          {/* Latest check-in */}
          {latestCheckin ? (
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] px-4 py-3 text-sm text-white print:rounded-none print:border-slate-200 print:bg-white print:text-slate-800">
              <span className="text-[var(--muted-foreground)] print:text-slate-600">Latest check-in: </span>
              {formatDateTime(latestCheckin.created_at)}
            </div>
          ) : null}

          {/* Upcoming appointments */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)] print:text-slate-600">
              <CalendarDays className="h-3.5 w-3.5 print:hidden" /> Upcoming visits
            </div>
            <div className="space-y-2">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.05)] px-4 py-3 print:rounded-none print:border-slate-200 print:bg-white"
                  >
                    <p className="text-sm font-semibold text-white print:text-black">{appointment.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)] print:text-slate-600">
                      {formatDateTime(appointment.scheduled_at)}
                    </p>
                    {appointment.notes ? (
                      <p className="mt-2 text-xs leading-5 text-white print:text-slate-900">{appointment.notes}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] px-4 py-3 text-sm text-[var(--muted-foreground)] print:rounded-none print:border-slate-200 print:bg-white print:text-slate-700">
                  No upcoming visit linked.
                </div>
              )}
            </div>
          </section>

          <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] px-4 py-3 print:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Generated
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">{formatDate(new Date().toISOString())}</p>
          </div>
        </aside>
      </div>

      <div className="print:hidden">
        <MedicalFooter />
      </div>
    </div>
  )
}
