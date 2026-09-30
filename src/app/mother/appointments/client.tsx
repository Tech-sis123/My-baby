"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, CalendarClock, ClipboardList, Clock, Plus, X } from "lucide-react"
import { AppHeader } from "@/components/app/app-header"
import { EmptyState, Notice, SectionHeading, StatTile } from "@/components/app/status"
import { MedicalFooter } from "@/components/medical-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { cn, formatStage } from "@/lib/utils"
import type { Appointment } from "@/lib/supabase/types"

interface Pregnancy {
  id: string
  due_date: string
  status: string
}

interface Child {
  id: string
  name: string
  birth_date: string
}

interface Props {
  motherId: string
  profileName: string
  appointments: Appointment[]
  pregnancies: Pregnancy[]
  babyProfiles: Child[]
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

function subjectText(
  appointment: Pick<Appointment, "subject_type" | "subject_id">,
  pregnancies: Pregnancy[],
  babyProfiles: Child[]
) {
  if (!appointment.subject_type || !appointment.subject_id) return "General care"

  if (appointment.subject_type === "pregnancy") {
    const pregnancy = pregnancies.find(item => item.id === appointment.subject_id)
    if (pregnancy) return `Pregnancy · ${formatStage("pregnancy", { due_date: pregnancy.due_date })}`
  }

  if (appointment.subject_type === "child") {
    const child = babyProfiles.find(item => item.id === appointment.subject_id)
    if (child) return `Baby · ${formatStage("child", { birth_date: child.birth_date, name: child.name })}`
  }

  return "General care"
}

function AppointmentCard({
  appointment,
  subjectLabel,
  upcoming,
}: {
  appointment: Appointment
  subjectLabel: string
  upcoming: boolean
}) {
  const date = new Date(appointment.scheduled_at)
  return (
    <li className={cn("surface flex gap-4 p-4", !upcoming && "opacity-70")}>
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--surface-sunken)] ring-1 ring-[var(--hairline)]">
        <span className={cn("text-[10px] font-semibold uppercase", upcoming ? "text-[var(--primary)]" : "text-slate-500")}>
          {date.toLocaleString("en-NG", { month: "short" })}
        </span>
        <span className="num text-xl font-semibold leading-none text-white">{date.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-white">{appointment.title}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              upcoming ? "bg-emerald-500/10 text-emerald-300" : "bg-white/[0.05] text-slate-400"
            )}
          >
            {upcoming ? "Upcoming" : "Past"}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--muted-foreground)]">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(appointment.scheduled_at)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{subjectLabel}</p>
        {appointment.notes ? <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{appointment.notes}</p> : null}
      </div>
    </li>
  )
}

export function AppointmentsClient({ motherId, profileName, appointments, pregnancies, babyProfiles }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [notes, setNotes] = useState("")
  const [subjectType, setSubjectType] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const now = new Date().toISOString()
  const upcoming = appointments.filter(appointment => appointment.scheduled_at >= now)
  const past = appointments.filter(appointment => appointment.scheduled_at < now)

  async function save() {
    if (!title.trim() || !scheduledAt) {
      setError("Add a visit title and date/time before saving.")
      setSuccess("")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    const supabase = createClient()
    const { error: insertError } = await supabase.from("appointments").insert({
      mother_id: motherId,
      title: title.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
      notes: notes.trim() || null,
      subject_type: subjectType || null,
      subject_id: subjectId || null,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message || "Could not save the appointment.")
      return
    }

    setSuccess("Appointment saved.")
    setShowForm(false)
    setTitle("")
    setScheduledAt("")
    setNotes("")
    setSubjectType("")
    setSubjectId("")
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <AppHeader role="mother" userName={profileName} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="motion-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Visits</h1>
            <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">Antenatal, postnatal and baby appointments in one place.</p>
          </div>
          {!showForm ? (
            <Button onClick={() => { setShowForm(true); setSuccess("") }}>
              <Plus className="h-4 w-4" /> Add visit
            </Button>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatTile label="Upcoming" value={upcoming.length} tone="primary" />
          <StatTile label="Past" value={past.length} />
          <StatTile label="Care tracks" value={pregnancies.length + babyProfiles.length} />
        </div>

        <div className="mt-6 space-y-6">
          {success ? <Notice tone="success">{success}</Notice> : null}
          {error ? <Notice tone="error">{error}</Notice> : null}

          {showForm ? (
            <section className="surface motion-rise p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <ClipboardList className="h-4 w-4 text-[var(--primary)]" /> New visit
                </h2>
                <button
                  onClick={() => { setShowForm(false); setError("") }}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="apt-title">Title</Label>
                    <Input id="apt-title" placeholder="Antenatal review" value={title} onChange={event => setTitle(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apt-time">Date and time</Label>
                    <Input id="apt-time" type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apt-subject">Related to</Label>
                  <select
                    id="apt-subject"
                    className="flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 text-[15px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
                    value={`${subjectType}:${subjectId}`}
                    onChange={event => {
                      const [type, id] = event.target.value.split(":")
                      setSubjectType(type)
                      setSubjectId(id || "")
                    }}
                  >
                    <option value=":">General care</option>
                    {pregnancies.map(pregnancy => (
                      <option key={pregnancy.id} value={`pregnancy:${pregnancy.id}`}>
                        Pregnancy — {formatStage("pregnancy", { due_date: pregnancy.due_date })}
                      </option>
                    ))}
                    {babyProfiles.map(child => (
                      <option key={child.id} value={`child:${child.id}`}>
                        Baby — {formatStage("child", { birth_date: child.birth_date, name: child.name })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apt-notes">Notes <span className="font-normal text-slate-500">(optional)</span></Label>
                  <Textarea id="apt-notes" placeholder="What is this visit for?" value={notes} onChange={event => setNotes(event.target.value)} />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={save} disabled={loading} className="flex-1 sm:flex-none">
                    {loading ? "Saving…" : "Save visit"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowForm(false); setError("") }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeading title="Upcoming" icon={<CalendarClock className="h-4 w-4" />} />
            {upcoming.length > 0 ? (
              <ul className="space-y-3">
                {upcoming.map(appointment => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    subjectLabel={subjectText(appointment, pregnancies, babyProfiles)}
                    upcoming
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Calendar className="h-5 w-5" />}
                title="No upcoming visits"
                description="Add your next antenatal or baby appointment so you never miss it."
              />
            )}
          </section>

          {past.length > 0 ? (
            <section>
              <SectionHeading title="Past" icon={<Calendar className="h-4 w-4" />} />
              <ul className="space-y-3">
                {past.map(appointment => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    subjectLabel={subjectText(appointment, pregnancies, babyProfiles)}
                    upcoming={false}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>

      <MedicalFooter />
    </div>
  )
}
