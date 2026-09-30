import Link from "next/link"
import { redirect } from "next/navigation"
import { Bot, CalendarClock, ClipboardList, MessageSquare, Phone, StickyNote } from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { SubHeader } from "@/components/app/sub-header"
import {
  DataField,
  EmptyState,
  SEVERITY_PANEL,
  SeverityBadge,
  SeverityDot,
  type Severity,
} from "@/components/app/status"
import { Button } from "@/components/ui/button"
import type { Appointment } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/server"
import { cn, formatStage } from "@/lib/utils"
import { ScheduleCallbackForm } from "./callback-form"

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
  const motherName = mother?.full_name || "Linked patient"

  const summary = [
    { label: "Phone", value: mother?.phone || "Not on file" },
    { label: "Check-ins", value: checkinRows.length },
    { label: "Urgent", value: redCount, cls: redCount > 0 ? "text-red-400" : "" },
    { label: "Review", value: yellowCount, cls: yellowCount > 0 ? "text-amber-400" : "" },
    { label: "Notes", value: notesCount },
    { label: "Last update", value: lastUpdate ? timeAgo(lastUpdate) : "None" },
  ]

  return (
    <div className="min-h-screen">
      <SubHeader
        backHref="/doctor/dashboard"
        width="wide"
        eyebrow={`${subjectType === "pregnancy" ? "Pregnancy" : "Baby"} · ${stage}`}
        title={motherName}
        actions={
          <>
            <SeverityBadge severity={overallSeverity} className="hidden sm:inline-flex" />
            <Link href={`/doctor/messages/${motherId}`}>
              <Button size="sm" variant="outline"><MessageSquare className="h-3.5 w-3.5" /><span className="hidden sm:inline">Message</span></Button>
            </Link>
            <Link href={`/doctor/ask?subjectType=${subjectType}&subjectId=${subjectId}`}>
              <Button size="sm"><Bot className="h-3.5 w-3.5" /><span className="hidden sm:inline">Ask copilot</span></Button>
            </Link>
          </>
        }
      />

      <main className="page motion-rise py-6 sm:py-8">
        {/* Patient summary */}
        <section className="surface grid grid-cols-2 divide-[var(--hairline)] sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          {summary.map(item => (
            <div key={item.label} className="px-5 py-4">
              <p className="data-label flex items-center gap-1.5">
                {item.label === "Phone" ? <Phone className="h-3 w-3" /> : null}
                {item.label}
              </p>
              <p className={cn("num mt-1 truncate text-lg font-semibold text-white", item.cls)}>{item.value}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Timeline */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <ClipboardList className="h-4 w-4 text-[var(--muted-foreground)]" /> Check-in timeline
              </h2>
              <span className="text-xs text-[var(--muted-foreground)]">
                {checkinRows.length > 0 ? `${checkinRows.length} entries` : "Awaiting first check-in"}
              </span>
            </div>

            {checkinRows.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-5 w-5" />}
                title="No check-ins yet"
                description="Entries will appear here as soon as the mother submits her first check-in."
              />
            ) : (
              <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[7px] before:top-4 before:w-px before:bg-[var(--hairline)]">
                {checkinRows.map(checkin => {
                  const flags = flagsByCheckin[checkin.id] || []
                  const severity = getSeverity(flags)
                  const details = payloadDetails(subjectType, checkin.payload)
                  const note = typeof checkin.payload?.note === "string" ? checkin.payload.note : null

                  return (
                    <li key={checkin.id} className="relative pl-7">
                      <SeverityDot severity={severity} className="absolute left-[3px] top-5 h-2.5 w-2.5 ring-4 ring-[var(--background)]" />
                      <article className={cn("rounded-xl border p-4 sm:p-5", severity === "green" ? "surface" : SEVERITY_PANEL[severity])}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{formatDateTime(checkin.created_at)}</p>
                          <SeverityBadge severity={severity} />
                        </div>

                        {flags.length > 0 ? (
                          <ul className="mt-3 space-y-1.5">
                            {flags.map(flag => (
                              <li
                                key={`${checkin.id}-${flag.rule_id}`}
                                className={cn(
                                  "flex items-start gap-2 text-[13px] leading-snug",
                                  flag.severity === "red" ? "text-red-300" : "text-amber-300"
                                )}
                              >
                                <SeverityDot severity={flag.severity === "red" ? "red" : "yellow"} className="mt-1.5 h-1.5 w-1.5" />
                                {flag.message}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {details.length > 0 ? (
                          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {details.map(detail => (
                              <DataField key={`${checkin.id}-${detail.label}`} label={detail.label} value={detail.value} />
                            ))}
                          </div>
                        ) : null}

                        {note ? (
                          <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2.5">
                            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <p className="text-[13px] leading-relaxed text-slate-200">{note}</p>
                          </div>
                        ) : null}
                      </article>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <ScheduleCallbackForm
              motherId={motherId}
              doctorId={user.id}
              subjectType={subjectType}
              subjectId={subjectId}
            />

            <section className="surface p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <CalendarClock className="h-4 w-4 text-[var(--muted-foreground)]" /> Scheduled callbacks
                <span className="num ml-auto text-xs font-normal text-[var(--muted-foreground)]">{appointmentRows.length}</span>
              </h2>
              {appointmentRows.length > 0 ? (
                <ul className="space-y-2">
                  {appointmentRows.map(appointment => {
                    const isUpcoming = appointment.scheduled_at >= new Date().toISOString()
                    return (
                      <li key={appointment.id} className="surface-sunken p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-white">{appointment.title}</p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              isUpcoming ? "bg-emerald-500/10 text-emerald-300" : "bg-white/[0.05] text-slate-400"
                            )}
                          >
                            {isUpcoming ? "Upcoming" : "Past"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatAppointmentDate(appointment.scheduled_at)}</p>
                        {appointment.notes ? <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{appointment.notes}</p> : null}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No callback booked yet.</p>
              )}
            </section>
          </aside>
        </div>
      </main>

      <MedicalFooter />
    </div>
  )
}
