"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Baby, HeartPulse, ShieldCheck, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MedicalFooter } from "@/components/medical-footer"
import { cn } from "@/lib/utils"
import type { FlagResult } from "@/lib/rules"

type Mood = "good" | "okay" | "low" | "very_low"
type Feeding = "breastmilk" | "formula" | "both" | "solids"

function ToggleOption({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-center text-sm font-medium transition",
        active
          ? "border-[rgba(201,139,88,0.5)] bg-[rgba(201,139,88,0.14)] text-white"
          : "border-[var(--border)] bg-[rgba(255,248,239,0.05)] text-[var(--muted-foreground)] hover:border-[rgba(201,139,88,0.28)] hover:text-white"
      )}
    >
      {label}
    </button>
  )
}

function BinaryQuestion({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: boolean | null
  onChange: (value: boolean) => void
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">{hint}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ToggleOption active={value === true} onClick={() => onChange(true)} label="Yes" />
        <ToggleOption active={value === false} onClick={() => onChange(false)} label="No" />
      </div>
    </div>
  )
}

function ResultScreen({ flags, onDone }: { flags: FlagResult[]; onDone: () => void }) {
  const redFlags = flags.filter(flag => flag.severity === "red")
  const yellowFlags = flags.filter(flag => flag.severity === "yellow")
  const tone =
    redFlags.length > 0
      ? "border-red-400/25 bg-red-500/10 text-red-100"
      : yellowFlags.length > 0
        ? "border-yellow-400/25 bg-yellow-500/10 text-yellow-100"
        : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"

  const heading =
    redFlags.length > 0 ? "Important alert recorded" : yellowFlags.length > 0 ? "Check-in recorded with follow-up note" : "Check-in recorded"

  const body =
    redFlags.length > 0
      ? "Some answers need quick review."
      : yellowFlags.length > 0
        ? "Your check-in was saved and a caution note was raised."
        : "Everything entered has been saved."

  const visibleFlags = redFlags.length > 0 ? redFlags : yellowFlags

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        <div className={`rounded-2xl border p-5 ${tone}`}>
          <p className="text-[10px] uppercase tracking-[0.24em]">Baby check-in</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{heading}</h1>
          <p className="mt-2 text-sm leading-6">{body}</p>
        </div>

        {visibleFlags.length > 0 ? (
          <div className="space-y-2">
            {visibleFlags.map(flag => (
              <div
                key={flag.rule_id}
                className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                  flag.severity === "red"
                    ? "border-red-400/25 bg-red-500/10 text-red-100"
                    : "border-yellow-400/25 bg-yellow-500/10 text-yellow-100"
                }`}
              >
                {flag.message}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
            No warning sign was raised from this check-in.
          </div>
        )}

        <Button className="w-full" onClick={onDone}>
          Back to dashboard
        </Button>
      </div>

      <MedicalFooter />
    </div>
  )
}

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

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

    const response = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_type: "child", subject_id: childId, payload }),
    })

    const data = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      alert("Check-in failed: " + (data.error || "Unknown error occurred while submitting."))
      return
    }

    setResult(data)
  }

  if (result) {
    return <ResultScreen flags={result.flags} onDone={() => router.push("/mother/home")} />
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.88)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">Baby check-in</p>
            <h1 className="text-base font-semibold text-white">Daily baby review</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 px-4 py-6">

        {/* Feeding */}
        <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            <Baby className="h-3.5 w-3.5" /> Feeding
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">How is baby feeding today?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ToggleOption active={feeding === "breastmilk"} onClick={() => setFeeding("breastmilk")} label="Breastmilk" />
            <ToggleOption active={feeding === "formula"} onClick={() => setFeeding("formula")} label="Formula" />
            <ToggleOption active={feeding === "both"} onClick={() => setFeeding("both")} label="Both" />
            <ToggleOption active={feeding === "solids"} onClick={() => setFeeding("solids")} label="Solids" />
          </div>
        </div>

        {/* Wet diapers */}
        <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
          <p className="text-sm font-semibold text-white">Wet diapers in the last 24 hours</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Helps spot hydration changes early.</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWetDiapers(value => String(Math.max(0, Number(value || 0) - 1)))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] text-lg font-semibold text-white transition hover:border-[rgba(201,139,88,0.34)]"
            >
              -
            </button>
            <Input
              type="number"
              min={0}
              max={20}
              value={wetDiapers}
              onChange={event => setWetDiapers(event.target.value)}
              className="max-w-[100px] text-center text-lg font-semibold"
            />
            <button
              type="button"
              onClick={() => setWetDiapers(value => String(Number(value || 0) + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] text-lg font-semibold text-white transition hover:border-[rgba(201,139,88,0.34)]"
            >
              +
            </button>
          </div>
          {Number(wetDiapers) < 6 && wetDiapers !== "" ? (
            <p className="mt-2 text-xs text-yellow-100">Fewer than 6 wet diapers can be worth paying attention to.</p>
          ) : null}
        </div>

        {/* Fever */}
        <div className="space-y-3">
          <BinaryQuestion
            label="Fever?"
            hint="Let us know if baby felt hot or had a raised temperature."
            value={fever}
            onChange={setFever}
          />
          {fever ? (
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Thermometer className="h-3.5 w-3.5" /> Temperature in °C
              </div>
              <div className="mt-3 max-w-[180px]">
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="37.5"
                  value={temp}
                  onChange={event => setTemp(event.target.value)}
                />
              </div>
            </div>
          ) : null}
          <BinaryQuestion
            label="Is baby breathing normally?"
            hint="Breathing changes are one of the most important signs to report clearly."
            value={breathingNormal}
            onChange={setBreathingNormal}
          />
        </div>

        {/* Mother mood */}
        <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            <HeartPulse className="h-3.5 w-3.5" /> Your mood today
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Your wellbeing is part of the full care picture.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ToggleOption active={motherMood === "good"} onClick={() => setMotherMood("good")} label="Good" />
            <ToggleOption active={motherMood === "okay"} onClick={() => setMotherMood("okay")} label="Okay" />
            <ToggleOption active={motherMood === "low"} onClick={() => setMotherMood("low")} label="Low" />
            <ToggleOption active={motherMood === "very_low"} onClick={() => setMotherMood("very_low")} label="Very low" />
          </div>
        </div>

        {/* Note */}
        <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            <ShieldCheck className="h-3.5 w-3.5" /> Add a note
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Anything unusual or worth flagging for follow-up.</p>
          <div className="mt-3">
            <Textarea
              placeholder="Anything else you want to note about today?"
              value={note}
              onChange={event => setNote(event.target.value)}
              maxLength={200}
              className="min-h-[80px]"
            />
            <p className="mt-1 text-right text-[10px] text-[var(--muted-foreground)]">{note.length}/200</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            type="submit"
            disabled={submitting || feeding === null || wetDiapers === "" || fever === null || breathingNormal === null || motherMood === null}
            className="sm:flex-1"
          >
            {submitting ? "Submitting…" : "Submit baby check-in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/mother/home")}
            className="border-[var(--border)] bg-transparent text-white sm:flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>

      <MedicalFooter />
    </div>
  )
}
