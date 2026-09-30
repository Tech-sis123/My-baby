"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Notice } from "@/components/app/status"
import { CalendarClock, LoaderCircle, Plus } from "lucide-react"

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
      scheduled_at: new Date(scheduledAt).toISOString(),
      notes: notes || null,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message || "Could not save the appointment right now.")
      return
    }

    setSaved("Callback scheduled and added to this patient's record.")
    setTitle("")
    setScheduledAt("")
    setNotes("")
    setOpen(false)
    router.refresh()
  }

  return (
    <section className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarClock className="h-4 w-4 text-[var(--primary)]" /> Book a callback
          </h2>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">Schedule the next call or review for this patient.</p>
        </div>
        {!open ? (
          <Button size="sm" onClick={() => { setOpen(true); setError(""); setSaved("") }}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        ) : null}
      </div>

      {saved ? <Notice tone="success" className="mt-4">{saved}</Notice> : null}
      {error ? <Notice tone="error" className="mt-4">{error}</Notice> : null}

      {open ? (
        <div className="mt-5 space-y-4 border-t border-[var(--hairline)] pt-5">
          <div className="space-y-2">
            <Label htmlFor="cb-title">Title</Label>
            <Input
              id="cb-title"
              placeholder="Post-check-in review call"
              value={title}
              onChange={event => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cb-time">Date and time</Label>
            <Input
              id="cb-time"
              type="datetime-local"
              value={scheduledAt}
              onChange={event => setScheduledAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cb-notes">Notes <span className="font-normal text-slate-500">(optional)</span></Label>
            <Textarea
              id="cb-notes"
              placeholder="What should be reviewed, and what triggered it?"
              value={notes}
              onChange={event => setNotes(event.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={loading} className="flex-1">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Saving…" : "Save callback"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setError("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
