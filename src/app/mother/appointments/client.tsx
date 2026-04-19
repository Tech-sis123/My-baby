"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MedicalFooter } from "@/components/medical-footer"
import { formatStage } from "@/lib/utils"
import { ArrowLeft, Plus, Calendar } from "lucide-react"
import type { Appointment } from "@/lib/supabase/types"

interface Pregnancy { id: string; due_date: string; status: string }
interface Child { id: string; name: string; birth_date: string }

interface Props {
  motherId: string
  appointments: Appointment[]
  pregnancies: Pregnancy[]
  babyProfiles: Child[]
}

export function AppointmentsClient({ motherId, appointments, pregnancies, babyProfiles }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [notes, setNotes] = useState("")
  const [subjectType, setSubjectType] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [loading, setLoading] = useState(false)

  const now = new Date().toISOString()
  const upcoming = appointments.filter(a => a.scheduled_at >= now)
  const past = appointments.filter(a => a.scheduled_at < now)

  async function save() {
    if (!title || !scheduledAt) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from("appointments").insert({
      mother_id: motherId,
      title,
      scheduled_at: scheduledAt,
      notes: notes || null,
      subject_type: subjectType || null,
      subject_id: subjectId || null,
    })
    setLoading(false)
    setShowForm(false)
    setTitle(""); setScheduledAt(""); setNotes(""); setSubjectType(""); setSubjectId("")
    router.refresh()
  }

  const subjectLabel = (apt: Appointment) => {
    if (!apt.subject_type || !apt.subject_id) return null
    if (apt.subject_type === "pregnancy") {
      const p = pregnancies.find(p => p.id === apt.subject_id)
      if (p) return `🤰 ${formatStage("pregnancy", { due_date: p.due_date })}`
    } else {
      const c = babyProfiles.find(c => c.id === apt.subject_id)
      if (c) return `🍼 ${formatStage("child", { birth_date: c.birth_date, name: c.name })}`
    }
    return null
  }

  const AptCard = ({ apt }: { apt: Appointment }) => (
    <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[var(--border)]">
      <Calendar className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-sm">{apt.title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {new Date(apt.scheduled_at).toLocaleDateString("en-NG", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })}
        </p>
        {subjectLabel(apt) && <p className="text-xs text-[var(--primary)] mt-0.5">{subjectLabel(apt)}</p>}
        {apt.notes && <p className="text-xs text-[var(--muted-foreground)] mt-1 italic">{apt.notes}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <header className="bg-white border-b border-[var(--border)] px-4 py-4 flex items-center gap-3">
        <Link href="/mother/home" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-[var(--foreground)]">Appointments</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Button className="w-full gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add appointment
        </Button>

        {showForm && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">New appointment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input placeholder="e.g. Antenatal visit" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Date & time</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Related to <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
                <select
                  className="w-full h-12 rounded-xl border-2 border-[var(--border)] px-3 bg-white text-sm"
                  value={`${subjectType}:${subjectId}`}
                  onChange={e => {
                    const [t, id] = e.target.value.split(":")
                    setSubjectType(t); setSubjectId(id || "")
                  }}
                >
                  <option value=":">General</option>
                  {pregnancies.map(p => (
                    <option key={p.id} value={`pregnancy:${p.id}`}>
                      🤰 {formatStage("pregnancy", { due_date: p.due_date })}
                    </option>
                  ))}
                  {babyProfiles.map(c => (
                    <option key={c.id} value={`child:${c.id}`}>
                      🍼 {formatStage("child", { birth_date: c.birth_date, name: c.name })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Notes <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
                <Textarea placeholder="Any notes…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={loading} className="flex-1">
                  {loading ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {upcoming.length > 0 && (
          <div>
            <h2 className="font-bold mb-3">Upcoming</h2>
            <div className="space-y-2">{upcoming.map(a => <AptCard key={a.id} apt={a} />)}</div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="font-bold mb-3 text-[var(--muted-foreground)]">Past</h2>
            <div className="space-y-2 opacity-60">{past.map(a => <AptCard key={a.id} apt={a} />)}</div>
          </div>
        )}

        {appointments.length === 0 && !showForm && (
          <div className="text-center py-10 text-[var(--muted-foreground)]">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-purple-200" />
            <p>No appointments yet.</p>
          </div>
        )}
      </div>

      <MedicalFooter />
    </div>
  )
}
