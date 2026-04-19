"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  motherId: string
  doctorId: string
  subjectType: string
  subjectId: string
}

export function ScheduleCallbackForm({ motherId, doctorId, subjectType, subjectId }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function save() {
    if (!title || !scheduledAt) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from("appointments").insert({
      mother_id: motherId,
      doctor_id: doctorId,
      subject_type: subjectType,
      subject_id: subjectId,
      title,
      scheduled_at: scheduledAt,
      notes: notes || null,
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setOpen(false); setTitle(""); setScheduledAt(""); setNotes("") }, 2000)
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        📅 Schedule callback
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Schedule callback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input placeholder="e.g. Follow-up call" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Date & time</Label>
          <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Notes <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
          <Textarea placeholder="Any notes for the appointment…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={loading || saved} className="flex-1">
            {saved ? "Saved ✓" : loading ? "Saving…" : "Save appointment"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}
