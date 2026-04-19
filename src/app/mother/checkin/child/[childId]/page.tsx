"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Activity, AlertTriangle, ArrowLeft, Baby, HeartPulse, ShieldCheck, Thermometer } from "lucide-react"
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
        "rounded-[1.15rem] border p-4 text-left transition",
        active
          ? "border-[rgba(201,139,88,0.34)] bg-[rgba(201,139,88,0.12)]"
          : "border-[var(--border)] bg-[rgba(255,248,239,0.05)] hover:border-[rgba(201,139,88,0.28)] hover:bg-[rgba(255,248,239,0.08)]"
      )}
    >
      <p className="text-base font-semibold text-white">{label}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p> : null}
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
    <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-white">{label}</p>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{hint}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ToggleOption active={value === true} onClick={() => onChange(true)} label="Yes" />
        <ToggleOption active={value === false} onClick={() => onChange(false)} label="No" />
      </div>
    </section>
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
      <div className="mx-auto max-w-3xl rounded-[2.2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <div className={`rounded-[1.6rem] border p-5 ${tone}`}>
          <p className="text-xs uppercase tracking-[0.24em]">Baby check-in</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{heading}</h1>
          <p className="mt-3 text-sm leading-6">{body}</p>
        </div>

        {visibleFlags.length > 0 ? (
          <div className="mt-5 space-y-3">
            {visibleFlags.map(flag => (
              <div
                key={flag.rule_id}
                className={`rounded-[1.2rem] border px-4 py-3 text-sm leading-6 ${
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
          <div className="mt-5 rounded-[1.2rem] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
            No warning sign was raised from this check-in.
          </div>
        )}

        <div className="mt-6">
          <Button className="w-full" onClick={onDone}>
            Back to dashboard
          </Button>
        </div>
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
    setResult(data)
  }

  if (result) {
    return <ResultScreen flags={result.flags} onDone={() => router.push("/mother/home")} />
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Baby check-in</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Daily baby review</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 xl:grid-cols-[1.16fr_0.84fr]">
        <section className="space-y-6">
          <section className="panel-float overflow-hidden rounded-[2.2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                  <Baby className="h-3.5 w-3.5" /> Under 1 minute
                </div>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Keep your baby updates clear so support stays practical and fast.
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  This check-in focuses on feeding, diapers, temperature, breathing, your own mood, and any note you want visible for follow-up.
                </p>
              </div>

              <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
                <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    <Activity className="h-4 w-4" /> Check-in focus
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Looks for</p>
                      <p className="mt-2 text-sm leading-6 text-white">Feeding pattern, wet diapers, fever, breathing, and mood.</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Why mood matters too</p>
                      <p className="mt-2 text-sm leading-6 text-white">Your wellbeing changes the care picture, so it belongs in the same review.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">Daily form</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Tell us how baby is doing</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Start with feeding and diapers, then add temperature, breathing, mood, and notes.
                </p>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Required fields first
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-white">How is baby feeding?</p>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">Choose the option that matches today best.</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ToggleOption active={feeding === "breastmilk"} onClick={() => setFeeding("breastmilk")} label="Breastmilk" />
                  <ToggleOption active={feeding === "formula"} onClick={() => setFeeding("formula")} label="Formula" />
                  <ToggleOption active={feeding === "both"} onClick={() => setFeeding("both")} label="Both" />
                  <ToggleOption active={feeding === "solids"} onClick={() => setFeeding("solids")} label="Solids" />
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-white">Wet diapers in the last 24 hours</p>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    This helps spot hydration changes early.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setWetDiapers(value => String(Math.max(0, Number(value || 0) - 1)))}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] text-xl font-semibold text-white transition hover:border-[rgba(201,139,88,0.34)]"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={wetDiapers}
                    onChange={event => setWetDiapers(event.target.value)}
                    className="max-w-[120px] text-center text-xl font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setWetDiapers(value => String(Number(value || 0) + 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] text-xl font-semibold text-white transition hover:border-[rgba(201,139,88,0.34)]"
                  >
                    +
                  </button>
                </div>
                {Number(wetDiapers) < 6 && wetDiapers !== "" ? (
                  <p className="mt-3 text-sm text-yellow-100">Fewer than 6 wet diapers can be worth paying attention to.</p>
                ) : null}
              </section>

              <div className="grid gap-6">
                <BinaryQuestion
                  label="Fever?"
                  hint="Let us know if baby felt hot or had a raised temperature."
                  value={fever}
                  onChange={setFever}
                />
                {fever ? (
                  <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      <Thermometer className="h-4 w-4" /> Temperature
                    </div>
                    <div className="mt-5 max-w-[220px] space-y-2">
                      <Label htmlFor="temp" className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Temperature in °C
                      </Label>
                      <Input
                        id="temp"
                        type="number"
                        step="0.1"
                        placeholder="37.5"
                        value={temp}
                        onChange={event => setTemp(event.target.value)}
                      />
                    </div>
                  </section>
                ) : null}
                <BinaryQuestion
                  label="Is baby breathing normally?"
                  hint="Breathing changes are one of the most important signs to report clearly."
                  value={breathingNormal}
                  onChange={setBreathingNormal}
                />
              </div>

              <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <HeartPulse className="h-4 w-4" /> Your mood today
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Your wellbeing matters too and helps give the full care picture.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ToggleOption active={motherMood === "good"} onClick={() => setMotherMood("good")} label="Good" />
                  <ToggleOption active={motherMood === "okay"} onClick={() => setMotherMood("okay")} label="Okay" />
                  <ToggleOption active={motherMood === "low"} onClick={() => setMotherMood("low")} label="Low" />
                  <ToggleOption active={motherMood === "very_low"} onClick={() => setMotherMood("very_low")} label="Very low" />
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <ShieldCheck className="h-4 w-4" /> Add a note
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Mention anything unusual or anything you want a doctor to understand quickly.
                </p>
                <div className="mt-5">
                  <Textarea
                    placeholder="Anything else you want to note about today?"
                    value={note}
                    onChange={event => setNote(event.target.value)}
                    maxLength={200}
                    className="min-h-[130px]"
                  />
                  <p className="mt-2 text-right text-xs text-[var(--muted-foreground)]">{note.length}/200</p>
                </div>
              </section>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                size="lg"
                disabled={submitting || feeding === null || wetDiapers === "" || fever === null || breathingNormal === null || motherMood === null}
                className="sm:flex-1"
              >
                {submitting ? "Submitting check-in" : "Submit baby check-in"}
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
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <AlertTriangle className="h-4 w-4" /> Why these questions
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                Feeding, diaper count, fever, and breathing are the answers most likely to change what happens next.
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                Your mood belongs here too, because baby care is not separate from how you are coping.
              </div>
            </div>
          </section>
        </aside>
      </div>

      <MedicalFooter />
    </div>
  )
}
