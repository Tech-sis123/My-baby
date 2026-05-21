"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Plus,
  X,
} from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { formatStage } from "@/lib/utils"
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
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{appointment.title}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{formatDateTime(appointment.scheduled_at)}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subjectLabel}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
            upcoming
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
              : "border-[var(--border)] bg-[rgba(255,248,239,0.06)] text-[var(--muted-foreground)]"
          }`}
        >
          {upcoming ? "Upcoming" : "Past"}
        </span>
      </div>

      {appointment.notes ? (
        <p className="mt-3 text-sm leading-6 text-white">{appointment.notes}</p>
      ) : null}
    </div>
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
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.88)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/mother/home"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">Appointments</p>
              <h1 className="text-base font-semibold text-white">{profileName}</h1>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowForm(value => !value)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add"}
          </Button>
        </div>
      </header>

      {/* Stat strip */}
      <div className="border-b border-[var(--border)] bg-[rgba(73,60,51,0.5)]">
        <div className="mx-auto flex w-full max-w-3xl divide-x divide-[var(--border)]">
          {[
            { label: "Upcoming", value: upcoming.length },
            { label: "Past", value: past.length },
            { label: "Care tracks", value: pregnancies.length + babyProfiles.length },
          ].map(stat => (
            <div key={stat.label} className="flex-1 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{stat.label}</p>
              <p className="mt-0.5 text-xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">

        {/* Feedback banners */}
        {success ? (
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {/* Add form */}
        {showForm ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <ClipboardList className="h-3.5 w-3.5" /> New appointment
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Title</Label>
                <Input
                  placeholder="Antenatal review"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Date and time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={event => setScheduledAt(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Related subject</Label>
              <select
                className="flex h-12 w-full rounded-xl border-2 border-[var(--border)] bg-[rgba(255,248,239,0.08)] px-4 py-2 text-base text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
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
                    Pregnancy - {formatStage("pregnancy", { due_date: pregnancy.due_date })}
                  </option>
                ))}
                {babyProfiles.map(child => (
                  <option key={child.id} value={`child:${child.id}`}>
                    Baby - {formatStage("child", { birth_date: child.birth_date, name: child.name })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Notes</Label>
              <Textarea
                placeholder="What is this visit for?"
                value={notes}
                onChange={event => setNotes(event.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={save} disabled={loading} className="flex-1">
                {loading ? "Saving…" : "Save appointment"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setError("") }}
                className="border-[var(--border)] bg-transparent text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {/* Upcoming */}
        <section>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            <CalendarClock className="h-3.5 w-3.5" /> Upcoming
          </div>
          <div className="space-y-3">
            {upcoming.length > 0 ? (
              upcoming.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  subjectLabel={subjectText(appointment, pregnancies, babyProfiles)}
                  upcoming
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-5 text-sm text-[var(--muted-foreground)]">
                No upcoming appointments yet. Use the Add button to schedule one.
              </div>
            )}
          </div>
        </section>

        {/* Past */}
        {past.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <Calendar className="h-3.5 w-3.5" /> Past
            </div>
            <div className="space-y-3">
              {past.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  subjectLabel={subjectText(appointment, pregnancies, babyProfiles)}
                  upcoming={false}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <MedicalFooter />
    </div>
  )
}
