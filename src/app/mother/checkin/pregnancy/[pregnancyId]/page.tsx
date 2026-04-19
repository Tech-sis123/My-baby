"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, CalendarDays, HeartPulse, ShieldCheck } from "lucide-react"
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
  value: YesNo
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
          <p className="text-xs uppercase tracking-[0.24em]">Pregnancy check-in</p>
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
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Pregnancy check-in</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Daily pregnancy review</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 xl:grid-cols-[1.16fr_0.84fr]">
        <section className="space-y-6">
          <section className="panel-float overflow-hidden rounded-[2.2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                  <HeartPulse className="h-3.5 w-3.5" /> Under 1 minute
                </div>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Keep your pregnancy updates clear so the next step is easier to spot.
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  This check-in captures how you feel, key warning signs, and any note you want your care team to see. If a doctor is linked, they can review new updates from their dashboard.
                </p>
              </div>

              <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
                <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    <CalendarDays className="h-4 w-4" /> Check-in focus
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Current track</p>
                      <p className="mt-2 text-lg font-semibold text-white">{weekLabel || "Pregnancy care"}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Looks for</p>
                      <p className="mt-2 text-sm leading-6 text-white">Bleeding, severe headache, swelling, movement, blood pressure, and notes.</p>
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
                <h2 className="mt-2 text-3xl font-semibold text-white">Tell us how today feels</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Answer the core questions first, then add blood pressure or a note if you have them.
                </p>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Required fields first
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-white">How are you feeling today?</p>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">Choose the option that feels closest.</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ToggleOption active={feeling === "good"} onClick={() => setFeeling("good")} label="Good" description="Feeling mostly well today." />
                  <ToggleOption active={feeling === "okay"} onClick={() => setFeeling("okay")} label="Okay" description="Not perfect, but manageable." />
                  <ToggleOption active={feeling === "not_great"} onClick={() => setFeeling("not_great")} label="Not great" description="Something feels off today." />
                </div>
              </section>

              <div className="grid gap-6">
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

              {showMovement ? (
                <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-semibold text-white">Baby movements today?</p>
                    <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                      This appears once movement should usually be part of the pregnancy picture.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <ToggleOption active={fetalMovement === true} onClick={() => setFetalMovement(true)} label="Yes" />
                    <ToggleOption active={fetalMovement === false} onClick={() => setFetalMovement(false)} label="No" />
                    <ToggleOption active={fetalMovement === "na"} onClick={() => setFetalMovement("na")} label="Not yet applicable" />
                  </div>
                </section>
              ) : null}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <HeartPulse className="h-4 w-4" /> Blood pressure
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Optional, but useful if you measured it today.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="Systolic"
                    value={bpSystolic}
                    onChange={event => setBpSystolic(event.target.value)}
                  />
                  <span className="text-sm font-semibold text-[var(--muted-foreground)]">/</span>
                  <Input
                    type="number"
                    placeholder="Diastolic"
                    value={bpDiastolic}
                    onChange={event => setBpDiastolic(event.target.value)}
                  />
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <ShieldCheck className="h-4 w-4" /> Add a note
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Include anything that feels important or unusual today.
                </p>
                <div className="mt-5">
                  <Textarea
                    placeholder="Anything else you want your care team to know?"
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
                disabled={submitting || feeling === null || bleeding === null || severeHeadache === null || swelling === null}
                className="sm:flex-1"
              >
                {submitting ? "Submitting check-in" : "Submit pregnancy check-in"}
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
                Bleeding, severe headache, swelling, and reduced movement are the answers most likely to change what happens next.
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                A short note can give context that simple yes or no questions miss.
              </div>
            </div>
          </section>
        </aside>
      </div>

      <MedicalFooter />
    </div>
  )
}
