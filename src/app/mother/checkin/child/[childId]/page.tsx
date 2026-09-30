"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Baby, Droplets, Heart, Minus, Plus, Thermometer, Wind } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubHeader } from "@/components/app/sub-header"
import { OptionTile, Question } from "@/components/app/option-tile"
import { SubmitBar } from "@/components/app/submit-bar"
import { Notice } from "@/components/app/status"

type Mood = "good" | "okay" | "low" | "very_low"
type Feeding = "breastmilk" | "formula" | "both" | "solids"

const stepperBtn =
  "flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] text-slate-200 hover:border-slate-500 active:scale-95"

export default function ChildCheckinPage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()

  const [feeding, setFeeding] = useState<Feeding | null>(null)
  const [wetDiapers, setWetDiapers] = useState("")
  const [fever, setFever] = useState<boolean | null>(null)
  const [temp, setTemp] = useState("")
  const [breathingNormal, setBreathingNormal] = useState<boolean | null>(null)
  const [motherMood, setMotherMood] = useState<Mood | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isValid = feeding !== null && wetDiapers !== "" && fever !== null && breathingNormal !== null && motherMood !== null
  const answered = [feeding, wetDiapers === "" ? null : wetDiapers, fever, breathingNormal, motherMood].filter(v => v !== null).length

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError("")
    const payload = {
      feeding,
      wet_diapers_24h: Number(wetDiapers),
      fever,
      ...(fever && temp ? { temp: Number(temp) } : {}),
      breathing_normal: breathingNormal,
      mother_mood: motherMood,
    }

    const response = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_type: "child", subject_id: childId, payload }),
    })

    if (response.ok) {
      router.replace(`/mother/home?checkinSuccess=true&subjectId=${childId}`)
    } else {
      setError("Check-in failed to save. Please try again.")
      setSubmitting(false)
    }
  }

  const diaperCount = Number(wetDiapers)

  return (
    <div className="min-h-screen">
      <SubHeader backHref="/mother/home" width="narrow" eyebrow="Baby check-in" title="Daily baby review" />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">How is your baby today?</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">A few quick questions about feeding, hydration and breathing.</p>
        </div>

        <form onSubmit={handleSubmit} className="motion-rise space-y-4">
          <p className="eyebrow">Nutrition & hydration</p>

          <Question title="Feeding" hint="How is the baby feeding today?" icon={Baby}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <OptionTile size="sm" active={feeding === "breastmilk"} onClick={() => setFeeding("breastmilk")} label="Breastmilk" />
              <OptionTile size="sm" active={feeding === "formula"} onClick={() => setFeeding("formula")} label="Formula" />
              <OptionTile size="sm" active={feeding === "both"} onClick={() => setFeeding("both")} label="Both" />
              <OptionTile size="sm" active={feeding === "solids"} onClick={() => setFeeding("solids")} label="Solids" />
            </div>
          </Question>

          <Question title="Wet diapers" hint="How many in the last 24 hours?" icon={Droplets}>
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setWetDiapers(value => String(Math.max(0, Number(value || 0) - 1)))}
                className={stepperBtn}
              >
                <Minus className="h-5 w-5" />
              </button>
              <Input
                type="number"
                inputMode="numeric"
                aria-label="Wet diapers in 24 hours"
                min={0}
                max={20}
                value={wetDiapers}
                onChange={e => setWetDiapers(e.target.value)}
                className="num h-16 w-28 border-transparent bg-transparent text-center text-4xl font-semibold focus:ring-0"
                placeholder="0"
              />
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setWetDiapers(value => String(Number(value || 0) + 1))}
                className={stepperBtn}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {wetDiapers !== "" && diaperCount < 6 && (
              <Notice tone="warning" className="mt-3">Fewer than 6 wet diapers a day can be a sign of dehydration.</Notice>
            )}
          </Question>

          <p className="eyebrow pt-4">Health & breathing</p>

          <Question title="Fever" hint="Does the baby feel hot or have a fever?" icon={Thermometer}>
            <div className="grid grid-cols-2 gap-3">
              <OptionTile size="sm" tone="alert" active={fever === true} onClick={() => setFever(true)} label="Yes" />
              <OptionTile size="sm" active={fever === false} onClick={() => { setFever(false); setTemp("") }} label="No" />
            </div>
            {fever && (
              <div className="mt-4 max-w-[220px] space-y-2">
                <Label htmlFor="temp">Temperature <span className="font-normal text-slate-500">(optional)</span></Label>
                <div className="relative">
                  <Input
                    id="temp"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="38.5"
                    value={temp}
                    onChange={e => setTemp(e.target.value)}
                    className="num pr-10 text-lg font-semibold"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">°C</span>
                </div>
              </div>
            )}
          </Question>

          <Question title="Breathing" hint="Is the baby breathing comfortably?" icon={Wind}>
            <div className="grid grid-cols-2 gap-3">
              <OptionTile size="sm" active={breathingNormal === true} onClick={() => setBreathingNormal(true)} label="Yes" />
              <OptionTile size="sm" tone="alert" active={breathingNormal === false} onClick={() => setBreathingNormal(false)} label="No" />
            </div>
          </Question>

          <p className="eyebrow pt-4">Your wellbeing</p>

          <Question title="How are you feeling emotionally?" hint="Your wellbeing is part of your baby's care." icon={Heart}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <OptionTile size="sm" active={motherMood === "good"} onClick={() => setMotherMood("good")} label="Good" />
              <OptionTile size="sm" active={motherMood === "okay"} onClick={() => setMotherMood("okay")} label="Okay" />
              <OptionTile size="sm" tone="alert" active={motherMood === "low"} onClick={() => setMotherMood("low")} label="Low" />
              <OptionTile size="sm" tone="alert" active={motherMood === "very_low"} onClick={() => setMotherMood("very_low")} label="Very low" />
            </div>
          </Question>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <SubmitBar answered={answered} total={5} disabled={!isValid} submitting={submitting} />
        </form>
      </main>
    </div>
  )
}
