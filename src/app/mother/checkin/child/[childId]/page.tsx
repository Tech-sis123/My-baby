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

type Mood = "good" | "okay" | "low" | "very_low"
type Feeding = "breastmilk" | "formula" | "both" | "solids"

export default function ChildCheckinPage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()

  const [feeding, setFeeding] = useState<Feeding | null>(null)
  const [wetDiapers, setWetDiapers] = useState("")
  const [fever, setFever] = useState<boolean | null>(null)
  const [temp, setTemp] = useState("")
  const [breathingNormal, setBreathingNormal] = useState<boolean | null>(null)
  const [motherMood, setMotherMood] = useState<Mood | null>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ flags: FlagResult[] } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (feeding === null || wetDiapers === "" || fever === null || breathingNormal === null || motherMood === null) return
    setSubmitting(true)

    const payload = {
      feeding,
      wet_diapers_24h: Number(wetDiapers),
      fever,
      ...(fever && temp ? { temp: Number(temp) } : {}),
      breathing_normal: breathingNormal,
      mother_mood: motherMood,
      ...(note ? { note } : {}),
    }

    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_type: "child", subject_id: childId, payload }),
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
              {redFlags.map(f => (
                <div key={f.rule_id} className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
                  <p className="font-semibold text-red-700">{f.message}</p>
                </div>
              ))}
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
              <p className="text-[var(--muted-foreground)]">Everything looks good. Well done!</p>
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

  const yesNo = (label: string, value: boolean | null, onChange: (v: boolean) => void) => (
    <div className="space-y-2">
      <Label className="text-base">{label}</Label>
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
          <h1 className="font-bold text-[var(--foreground)]">Baby check-in</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Takes about 60 seconds</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Feeding */}
        <div className="space-y-2">
          <Label className="text-base">How is baby feeding?</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: "breastmilk" as Feeding, label: "Breastmilk" },
              { val: "formula" as Feeding, label: "Formula" },
              { val: "both" as Feeding, label: "Both" },
              { val: "solids" as Feeding, label: "Solids" },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setFeeding(opt.val)}
                className={cn(
                  "py-3 rounded-xl border-2 font-medium transition-all",
                  feeding === opt.val
                    ? "border-[var(--primary)] bg-purple-50 text-[var(--primary)]"
                    : "border-[var(--border)] bg-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wet diapers */}
        <div className="space-y-2">
          <Label className="text-base">Wet diapers in last 24 hours</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWetDiapers(d => String(Math.max(0, Number(d || 0) - 1)))}
              className="w-12 h-12 rounded-xl border-2 border-[var(--border)] text-xl font-bold bg-white"
            >−</button>
            <Input
              type="number"
              min={0}
              max={20}
              value={wetDiapers}
              onChange={e => setWetDiapers(e.target.value)}
              className="w-20 text-center text-xl font-bold"
            />
            <button
              type="button"
              onClick={() => setWetDiapers(d => String(Number(d || 0) + 1))}
              className="w-12 h-12 rounded-xl border-2 border-[var(--border)] text-xl font-bold bg-white"
            >+</button>
          </div>
          {Number(wetDiapers) < 6 && wetDiapers !== "" && (
            <p className="text-xs text-yellow-600">Less than 6 wet diapers may indicate dehydration — worth monitoring.</p>
          )}
        </div>

        {yesNo("Fever?", fever, setFever)}

        {fever && (
          <div className="space-y-2">
            <Label>Temperature <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="37.5"
                value={temp}
                onChange={e => setTemp(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-[var(--muted-foreground)]">°C</span>
            </div>
          </div>
        )}

        {yesNo("Is baby breathing normally?", breathingNormal, setBreathingNormal)}

        {/* Mother mood */}
        <div className="space-y-2">
          <Label className="text-base">How is your mood today?</Label>
          <p className="text-xs text-[var(--muted-foreground)]">Your wellbeing matters too.</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: "good" as Mood, emoji: "😊", label: "Good" },
              { val: "okay" as Mood, emoji: "😐", label: "Okay" },
              { val: "low" as Mood, emoji: "😔", label: "Low" },
              { val: "very_low" as Mood, emoji: "😢", label: "Very low" },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setMotherMood(opt.val)}
                className={cn(
                  "py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all",
                  motherMood === opt.val
                    ? "border-[var(--primary)] bg-purple-50 text-[var(--primary)]"
                    : "border-[var(--border)] bg-white"
                )}
              >
                <span>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Any notes? <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
          <Textarea
            placeholder="Anything else to add…"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={200}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitting || feeding === null || wetDiapers === "" || fever === null || breathingNormal === null || motherMood === null}
        >
          {submitting ? "Submitting…" : "Submit check-in"}
        </Button>
      </form>

      <MedicalFooter />
    </div>
  )
}
