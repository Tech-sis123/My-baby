"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarClock, CheckCircle2, ChevronDown, LoaderCircle, Plus } from "lucide-react"

interface Props {
  motherId: string
  doctorId: string
  subjectType: string
  subjectId: string
}

export function ScheduleCallbackForm({ motherId, doctorId, subjectType, subjectId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function save() {
    if (!title || !scheduledAt) {
      setError("Add a title and appointment time before saving.")
      return
    }

    setError("")
    setSaved("")
    setLoading(true)
    const supabase = createClient()
    const { error: insertError } = await supabase.from("appointments").insert({
      mother_id: motherId,
      doctor_id: doctorId,
      subject_type: subjectType,
      subject_id: subjectId,
      title,
      scheduled_at: scheduledAt,
      notes: notes || null,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message || "Could not save the appointment right now.")
      return
    }

    setSaved("Callback scheduled and added to this patient timeline.")
    setTitle("")
    setScheduledAt("")
    setNotes("")
    setOpen(false)
    router.refresh()
  }

  return (
    <section className="rounded-[1.8rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
            <CalendarClock className="h-4 w-4" /> Callback planner
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-white">Book the next touchpoint</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            Schedule a phone call or review slot for this linked mother and care track without leaving the case.
          </p>
        </div>

        <Button
          type="button"
          variant={open ? "outline" : "default"}
          onClick={() => {
            setOpen(value => !value)
            setError("")
          }}
          className={open ? "border-[var(--border)] bg-transparent text-white" : ""}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Hide form" : "Schedule callback"}
        </Button>
      </div>

      {saved ? (
        <div className="mt-4 rounded-[1.25rem] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{saved}</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {open ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Title</Label>
            <Input
              placeholder="Post-check-in review call"
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

          <div className="space-y-2 lg:col-span-2">
            <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Notes
            </Label>
            <Textarea
              placeholder="What should be reviewed on the call, and what triggered it?"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row">
            <Button onClick={save} disabled={loading} className="sm:flex-1">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
              {loading ? "Saving appointment" : "Save appointment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setError("")
              }}
              className="border-[var(--border)] bg-transparent text-white sm:flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            Keep the next action explicit. Booking a callback here makes the doctor side feel operational instead of passive.
          </p>
        </div>
      )}
    </section>
  )
}
