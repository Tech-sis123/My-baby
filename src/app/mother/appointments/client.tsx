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
  ShieldCheck,
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
    <div className="rounded-[1.45rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{appointment.title}</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{formatDateTime(appointment.scheduled_at)}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
            upcoming
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
              : "border-[var(--border)] bg-[rgba(255,248,239,0.06)] text-[var(--muted-foreground)]"
          }`}
        >
          {upcoming ? "Upcoming" : "Past"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Related track</p>
          <p className="mt-2 text-sm text-white">{subjectLabel}</p>
        </div>

        <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Visit status</p>
          <p className="mt-2 text-sm text-white">{upcoming ? "Still ahead" : "Already happened"}</p>
        </div>
      </div>

      {appointment.notes ? (
        <div className="mt-4 rounded-[1.1rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Notes</p>
          <p className="mt-2 text-sm leading-6 text-white">{appointment.notes}</p>
        </div>
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
      scheduled_at: scheduledAt,
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
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
          <Link
            href="/mother/home"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Appointments</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Keep visits visible and planned</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 xl:grid-cols-[1.16fr_0.84fr]">
        <section className="space-y-6">
          <section className="panel-float overflow-hidden rounded-[2.2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                  <CalendarClock className="h-3.5 w-3.5" /> Care planning
                </div>

                <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  {profileName}, keep the next visit obvious before it becomes urgent.
                </h2>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  Use this page to track upcoming appointments, link them to the correct pregnancy or baby journey, and keep the visit notes visible without digging through the dashboard.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Upcoming</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{upcoming.length}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Past</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{past.length}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[rgba(201,139,88,0.24)] bg-[rgba(201,139,88,0.1)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground)]">Care tracks</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{pregnancies.length + babyProfiles.length}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
                <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    <ShieldCheck className="h-4 w-4" /> Why this page matters
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 text-sm leading-6 text-white">
                      Appointments stop feeling buried when the next visit sits on its own planning surface.
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 text-sm leading-6 text-white">
                      Linking an appointment to a pregnancy or baby track keeps the context clear later.
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 text-sm leading-6 text-white">
                      Notes here help you remember what the visit is for before the day arrives.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">Planner</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Add or review appointments</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Schedule a visit and connect it to the right care track if needed.
                </p>
              </div>
              <Button onClick={() => setShowForm(value => !value)} className="lg:min-w-[220px]">
                <Plus className="h-4 w-4" /> {showForm ? "Hide planner" : "Add appointment"}
              </Button>
            </div>

            {success ? (
              <div className="mt-5 rounded-[1.25rem] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{success}</span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {showForm ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
                <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    <ClipboardList className="h-4 w-4" /> Appointment details
                  </div>
                  <div className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Title</Label>
                      <Input
                        placeholder="Antenatal review"
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Date and time</Label>
                      <Input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={event => setScheduledAt(event.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    <Calendar className="h-4 w-4" /> Link it to a track
                  </div>
                  <div className="mt-5 space-y-4">
                    <div className="space-y-2">
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

                    <div className="space-y-2">
                      <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Notes</Label>
                      <Textarea
                        placeholder="What is this visit for, and what do you want to remember?"
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                        className="min-h-[130px]"
                      />
                    </div>
                  </div>
                </section>

                <div className="xl:col-span-2 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={save} disabled={loading} className="sm:flex-1">
                    {loading ? "Saving appointment" : "Save appointment"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setError("")
                    }}
                    className="border-[var(--border)] bg-transparent text-white sm:flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <CalendarClock className="h-4 w-4" /> Upcoming appointments
            </div>
            <div className="mt-5 space-y-4">
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
                <div className="rounded-[1.35rem] border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-5 text-sm leading-6 text-[var(--muted-foreground)]">
                  No upcoming appointments yet. Add the next visit so it stays visible on the calendar side of the product.
                </div>
              )}
            </div>
          </section>

          {past.length > 0 ? (
            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Calendar className="h-4 w-4" /> Past appointments
              </div>
              <div className="mt-5 space-y-4">
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
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <ShieldCheck className="h-4 w-4" /> Good appointment notes
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                State what the visit is for.
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                Link it to the right pregnancy or baby profile when that context matters.
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                Add one sentence about what you want to ask or remember.
              </div>
            </div>
          </section>
        </aside>
      </div>

      <MedicalFooter />
    </div>
  )
}
