"use client"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MedicalFooter } from "@/components/medical-footer"
import { cn } from "@/lib/utils"
import type { FlagResult } from "@/lib/rules"
import { ArrowLeft } from "lucide-react"

type Feeling = "good" | "okay" | "not_great"
type YesNo = boolean | null
type Movement = boolean | "na" | null

export default function PregnancyCheckinPage() {
  const router = useRouter()
  const { pregnancyId } = useParams<{ pregnancyId: string }>()

  const [feeling, setFeeling] = useState<Feeling | null>(null)
  const [bleeding, setBleeding] = useState<YesNo>(null)
  const [severeHeadache, setSevereHeadache] = useState<YesNo>(null)
  const [swelling, setSwelling] = useState<YesNo>(null)
  const [fetalMovement, setFetalMovement] = useState<Movement>(null)
  const [showMovement, setShowMovement] = useState(false) // set true only if week >= 20
  const [bpSystolic, setBpSystolic] = useState("")
  const [bpDiastolic, setBpDiastolic] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ flags: FlagResult[] } | null>(null)

  // We lazily check gestational week from the pregnancy on mount
  useState(() => {
    // Fetch week from API to determine if movement question applies
    fetch(`/api/pregnancy-week?id=${pregnancyId}`)
      .then(r => r.json())
      .then(d => { if (d.week >= 20) setShowMovement(true) })
      .catch(() => {})
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (feeling === null || bleeding === null || severeHeadache === null || swelling === null) return
    setSubmitting(true)

    const payload = {
      feeling,
      bleeding,
      severe_headache: severeHeadache,
      swelling,
      ...(showMovement && fetalMovement !== null ? { fetal_movement: fetalMovement === "na" ? null : fetalMovement } : {}),
      ...(bpSystolic ? { bp_systolic: Number(bpSystolic) } : {}),
      ...(bpDiastolic ? { bp_diastolic: Number(bpDiastolic) } : {}),
      ...(note ? { note } : {}),
    }

    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_type: "pregnancy", subject_id: pregnancyId, payload }),
    })
    const data = await res.json()
    setSubmitting(false)
    setResult(data)
  }

  if (result) {
    const redFlags = result.flags.filter(f => f.severity === "red")
    const yellowFlags = result.flags.filter(f => f.severity === "yellow")
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 pb-20">
        <div className="max-w-md w-full text-center space-y-6">
          {redFlags.length > 0 ? (
            <>
              <div className="text-5xl">⚠️</div>
              <h1 className="text-2xl font-bold text-red-600">Important alert</h1>
              <div className="space-y-3">
                {redFlags.map(f => (
                  <div key={f.rule_id} className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
                    <p className="font-semibold text-red-700">{f.message}</p>
                  </div>
                ))}
              </div>
            </>
          ) : yellowFlags.length > 0 ? (
            <>
              <div className="text-5xl">💛</div>
              <h1 className="text-2xl font-bold text-yellow-700">Check-in recorded</h1>
              {yellowFlags.map(f => (
                <div key={f.rule_id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-left">
                  <p className="text-yellow-800">{f.message}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="text-5xl">💜</div>
              <h1 className="text-2xl font-bold">Check-in recorded!</h1>
              <p className="text-[var(--muted-foreground)]">Everything looks good. Keep it up!</p>
            </>
          )}
          <Button className="w-full" onClick={() => router.push("/mother/home")}>
            Back to home
          </Button>
        </div>
        <MedicalFooter />
      </div>
    )
  }

  const yesNo = (label: string, value: YesNo, onChange: (v: boolean) => void) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-3">
        {[{ label: "Yes", val: true }, { label: "No", val: false }].map(opt => (
          <button
            key={String(opt.val)}
            type="button"
            onClick={() => onChange(opt.val)}
            className={cn(
              "flex-1 py-3 rounded-xl border-2 font-medium transition-all text-base",
              value === opt.val
                ? "border-[var(--primary)] bg-purple-50 text-[var(--primary)]"
                : "border-[var(--border)] bg-white"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <header className="bg-white border-b border-[var(--border)] px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-[var(--foreground)]">Pregnancy check-in</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Takes about 60 seconds</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Feeling */}
        <div className="space-y-2">
          <Label className="text-base">How are you feeling today?</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: "good" as Feeling, emoji: "😊", label: "Good" },
              { val: "okay" as Feeling, emoji: "😐", label: "Okay" },
              { val: "not_great" as Feeling, emoji: "😔", label: "Not great" },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setFeeling(opt.val)}
                className={cn(
                  "py-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all",
                  feeling === opt.val
                    ? "border-[var(--primary)] bg-purple-50"
                    : "border-[var(--border)] bg-white"
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {yesNo("Any bleeding?", bleeding, setBleeding)}
        {yesNo("Severe headache?", severeHeadache, setSevereHeadache)}
        {yesNo("Swelling in hands or face?", swelling, setSwelling)}

        {showMovement && (
          <div className="space-y-2">
            <Label>Baby movements today?</Label>
            <div className="flex gap-2">
              {[
                { val: true, label: "Yes" },
                { val: false, label: "No" },
                { val: "na", label: "Not yet applicable" },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setFetalMovement(opt.val as Movement)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                    fetalMovement === opt.val
                      ? "border-[var(--primary)] bg-purple-50 text-[var(--primary)]"
                      : "border-[var(--border)] bg-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Blood pressure reading <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Systolic"
              value={bpSystolic}
              onChange={e => setBpSystolic(e.target.value)}
              className="w-28"
            />
            <span className="text-[var(--muted-foreground)] font-bold">/</span>
            <Input
              type="number"
              placeholder="Diastolic"
              value={bpDiastolic}
              onChange={e => setBpDiastolic(e.target.value)}
              className="w-28"
            />
            <span className="text-sm text-[var(--muted-foreground)]">mmHg</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Any notes? <span className="font-normal text-[var(--muted-foreground)]">(optional, max 200 characters)</span></Label>
          <Textarea
            placeholder="Anything else to add…"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-right text-[var(--muted-foreground)]">{note.length}/200</p>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitting || feeling === null || bleeding === null || severeHeadache === null || swelling === null}
        >
          {submitting ? "Submitting…" : "Submit check-in"}
        </Button>
      </form>

      <MedicalFooter />
    </div>
  )
}
