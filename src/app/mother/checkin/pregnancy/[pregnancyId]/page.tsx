"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MedicalFooter } from "@/components/medical-footer"
import { cn } from "@/lib/utils"
import type { FlagResult } from "@/lib/rules"

type Feeling = "good" | "okay" | "not_great"
type YesNo = boolean | null
type Movement = boolean | "na" | null

function ToggleOption({
  active,
  onClick,
  label,
  description,
}: {
  active: boolean
  onClick: () => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition",
        active
          ? "border-[rgba(201,139,88,0.5)] bg-[rgba(201,139,88,0.14)]"
          : "border-[var(--border)] bg-[rgba(255,248,239,0.05)] hover:border-[rgba(201,139,88,0.28)] hover:bg-[rgba(255,248,239,0.08)]"
      )}
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      {description ? <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{description}</p> : null}
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
  value: YesNo
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
          <p className="text-[10px] uppercase tracking-[0.24em]">Pregnancy check-in</p>
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

export default function PregnancyCheckinPage() {
  const router = useRouter()
  const { pregnancyId } = useParams<{ pregnancyId: string }>()

  const [feeling, setFeeling] = useState<Feeling | null>(null)
  const [bleeding, setBleeding] = useState<YesNo>(null)
  const [severeHeadache, setSevereHeadache] = useState<YesNo>(null)
  const [swelling, setSwelling] = useState<YesNo>(null)
  const [fetalMovement, setFetalMovement] = useState<Movement>(null)
  const [showMovement, setShowMovement] = useState(false)
  const [weekLabel, setWeekLabel] = useState("")
  const [bpSystolic, setBpSystolic] = useState("")
  const [bpDiastolic, setBpDiastolic] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ flags: FlagResult[] } | null>(null)

  useEffect(() => {
    let active = true

    fetch(`/api/pregnancy-week?id=${pregnancyId}`)
      .then(response => response.json())
      .then(data => {
        if (!active) return
        if (typeof data.week === "number") {
          setWeekLabel(`Week ${data.week}`)
          if (data.week >= 20) setShowMovement(true)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [pregnancyId])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

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

    const response = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_type: "pregnancy", subject_id: pregnancyId, payload }),
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
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">Pregnancy check-in</p>
            <h1 className="text-base font-semibold text-white">
              Daily review{weekLabel ? ` · ${weekLabel}` : ""}
            </h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 px-4 py-6">

        {/* Feeling */}
        <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
          <p className="text-sm font-semibold text-white">How are you feeling today?</p>
          <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">Choose the option that feels closest.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <ToggleOption active={feeling === "good"} onClick={() => setFeeling("good")} label="Good" description="Mostly well" />
            <ToggleOption active={feeling === "okay"} onClick={() => setFeeling("okay")} label="Okay" description="Manageable" />
            <ToggleOption active={feeling === "not_great"} onClick={() => setFeeling("not_great")} label="Not great" description="Something's off" />
          </div>
        </div>

        {/* Binary questions */}
        <div className="space-y-3">
          <BinaryQuestion
            label="Any bleeding?"
            hint="Tell us if you noticed any bleeding today."
            value={bleeding}
            onChange={setBleeding}
          />
          <BinaryQuestion
            label="Severe headache?"
            hint="A strong or unusual headache can matter in pregnancy."
            value={severeHeadache}
            onChange={setSevereHeadache}
          />
          <BinaryQuestion
            label="Swelling in your hands or face?"
            hint="This helps identify changes worth reviewing."
            value={swelling}
            onChange={setSwelling}
          />
        </div>

        {/* Fetal movement (week ≥ 20) */}
        {showMovement ? (
          <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
            <p className="text-sm font-semibold text-white">Baby movements today?</p>
            <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">Track appears once movement is expected.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <ToggleOption active={fetalMovement === true} onClick={() => setFetalMovement(true)} label="Yes" />
              <ToggleOption active={fetalMovement === false} onClick={() => setFetalMovement(false)} label="No" />
              <ToggleOption active={fetalMovement === "na"} onClick={() => setFetalMovement("na")} label="N/A" />
            </div>
          </div>
        ) : null}

        {/* Blood pressure + note */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <HeartPulse className="h-3.5 w-3.5" /> Blood pressure
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Optional — if you measured today.</p>
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                placeholder="Systolic"
                value={bpSystolic}
                onChange={event => setBpSystolic(event.target.value)}
              />
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">/</span>
              <Input
                type="number"
                placeholder="Diastolic"
                value={bpDiastolic}
                onChange={event => setBpDiastolic(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Add a note
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Anything your care team should know.</p>
            <div className="mt-3">
              <Textarea
                placeholder="Anything else you want to mention?"
                value={note}
                onChange={event => setNote(event.target.value)}
                maxLength={200}
                className="min-h-[72px]"
              />
              <p className="mt-1 text-right text-[10px] text-[var(--muted-foreground)]">{note.length}/200</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            type="submit"
            disabled={submitting || feeling === null || bleeding === null || severeHeadache === null || swelling === null}
            className="sm:flex-1"
          >
            {submitting ? "Submitting…" : "Submit pregnancy check-in"}
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
