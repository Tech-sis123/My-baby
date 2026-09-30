import { redirect } from "next/navigation"
import { AlertTriangle, CalendarDays, ClipboardList } from "lucide-react"
import { SubHeader } from "@/components/app/sub-header"
import {
  DataField,
  EmptyState,
  Notice,
  SEVERITY_TEXT,
  SectionHeading,
  severityTone,
} from "@/components/app/status"
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

  const summary = [
    { label: "Active alerts", value: activeFlags.length, cls: activeFlags.length > 0 ? SEVERITY_TEXT[flagSeverity] : "" },
    { label: "Check-ins (7 days)", value: checkinRows.length, cls: "" },
    { label: "Next visit", value: upcomingAppointments.length > 0 ? formatDate(upcomingAppointments[0].scheduled_at) : "None", cls: "" },
    { label: "Doctor", value: doctor?.clinic_name || (subject.linked_doctor_id ? "Linked" : "Not linked"), cls: "" },
  ]

  return (
    <div className="min-h-screen print:bg-white">
      <SubHeader
        backHref="/mother/home"
        eyebrow="Pre-visit brief"
        title={stage}
        actions={<PrintButton />}
      />

      <main className="page motion-rise max-w-5xl py-8 print:max-w-none print:p-0 print:text-slate-900">
        {/* Document header */}
        <div className="flex flex-col gap-2 border-b border-[var(--hairline)] pb-6 sm:flex-row sm:items-end sm:justify-between print:border-slate-300">
          <div>
            <p className="eyebrow print:text-slate-500">{subjectType === "pregnancy" ? "Pregnancy" : "Baby"} · Summary for your clinician</p>
            <h1 className="mt-1 text-2xl font-semibold text-white print:text-black">{stage}</h1>
          </div>
          <p className="text-[13px] text-[var(--muted-foreground)] print:text-slate-600">
            Generated {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Summary */}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.map(item => (
            <div key={item.label} className="surface p-4 print:rounded-none print:border-slate-300 print:bg-white">
              <p className="data-label print:text-slate-500">{item.label}</p>
              <p className={`num mt-1 truncate text-lg font-semibold text-white print:text-black ${item.cls}`}>{item.value}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Check-in history */}
          <section>
            <SectionHeading
              title="Last 7 days"
              icon={<ClipboardList className="h-4 w-4 print:hidden" />}
              action={<span className="text-xs text-[var(--muted-foreground)]">{checkinRows.length} entries</span>}
            />

            {checkinRows.length === 0 ? (
              <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="No check-ins in the last 7 days" />
            ) : (
              <div className="space-y-3">
                {checkinRows.map(checkin => {
                  const details = summaryItems(subjectType, checkin.payload)
                  const note = typeof checkin.payload?.note === "string" ? checkin.payload.note : null

                  return (
                    <article key={checkin.id} className="surface p-4 print:break-inside-avoid print:rounded-none print:border-slate-300 print:bg-white">
                      <p className="text-sm font-semibold text-white print:text-black">{formatDateTime(checkin.created_at)}</p>

                      {details.length > 0 ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {details.map(detail => (
                            <DataField
                              key={`${checkin.id}-${detail.label}`}
                              label={detail.label}
                              value={detail.value}
                              className="print:rounded-none print:border-slate-200 print:bg-white [&_p:last-child]:print:text-black"
                            />
                          ))}
                        </div>
                      ) : null}

                      {note ? (
                        <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2.5 text-[13px] leading-relaxed text-slate-200 print:bg-white print:px-0 print:text-slate-800">
                          <span className="font-medium">Note: </span>{note}
                        </p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            <section>
              <SectionHeading title="Active alerts" icon={<AlertTriangle className="h-4 w-4 print:hidden" />} />
              <div className="space-y-2">
                {activeFlags.length > 0 ? (
                  activeFlags.slice(0, 4).map(flag => (
                    <Notice key={flag.id} tone={severityTone(flag.severity)} className="print:rounded-none print:border-slate-300 print:bg-white print:text-black">
                      {flag.message}
                    </Notice>
                  ))
                ) : (
                  <Notice tone="success" className="print:rounded-none print:border-slate-300 print:bg-white print:text-black">
                    No active alerts right now.
                  </Notice>
                )}
              </div>
            </section>

            <section>
              <SectionHeading title="Upcoming visits" icon={<CalendarDays className="h-4 w-4 print:hidden" />} />
              {upcomingAppointments.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingAppointments.map(appointment => (
                    <li key={appointment.id} className="surface p-3.5 print:rounded-none print:border-slate-300 print:bg-white">
                      <p className="text-sm font-semibold text-white print:text-black">{appointment.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)] print:text-slate-600">{formatDateTime(appointment.scheduled_at)}</p>
                      {appointment.notes ? <p className="mt-2 text-[13px] text-slate-300 print:text-slate-800">{appointment.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No upcoming visit linked.</p>
              )}
            </section>

            {latestCheckin ? (
              <p className="text-[13px] text-[var(--muted-foreground)] print:text-slate-600">
                Latest check-in: <span className="text-slate-200 print:text-black">{formatDateTime(latestCheckin.created_at)}</span>
              </p>
            ) : null}
          </aside>
        </div>
      </main>

      <MedicalFooter />
    </div>
  )
}
