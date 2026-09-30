"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Activity, Droplet, Frown, HeartPulse, Meh, Smile, Brain, Hand } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubHeader } from "@/components/app/sub-header"
import { OptionTile, Question } from "@/components/app/option-tile"
import { SubmitBar } from "@/components/app/submit-bar"
import { Notice } from "@/components/app/status"

type Feeling = "good" | "okay" | "not_great"
type YesNo = boolean | null
type Movement = boolean | "na" | null

function YesNoGrid({ value, onChange }: { value: YesNo; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <OptionTile size="sm" tone="alert" active={value === true} onClick={() => onChange(true)} label="Yes" />
      <OptionTile size="sm" active={value === false} onClick={() => onChange(false)} label="No" />
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

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
    return () => { active = false }
  }, [pregnancyId])

  const isValid = feeling !== null && bleeding !== null && severeHeadache !== null && swelling !== null && (!showMovement || fetalMovement !== null)
  const required = [feeling, bleeding, severeHeadache, swelling, ...(showMovement ? [fetalMovement] : [])]
  const answered = required.filter(v => v !== null).length

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError("")
    const payload = {
      feeling,
      bleeding,
      severe_headache: severeHeadache,
      swelling,
      ...(showMovement && fetalMovement !== null ? { fetal_movement: fetalMovement === "na" ? null : fetalMovement } : {}),
      ...(bpSystolic ? { bp_systolic: Number(bpSystolic) } : {}),
      ...(bpDiastolic ? { bp_diastolic: Number(bpDiastolic) } : {}),
    }

    const response = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_type: "pregnancy", subject_id: pregnancyId, payload }),
    })

    if (response.ok) {
      router.replace(`/mother/home?checkinSuccess=true&subjectId=${pregnancyId}`)
    } else {
      setError("Check-in failed to save. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <SubHeader
        backHref="/mother/home"
        width="narrow"
        eyebrow={`Pregnancy check-in${weekLabel ? ` · ${weekLabel}` : ""}`}
        title="Daily health review"
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">How are things today?</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Takes about a minute. Your doctor sees warning signs straight away.</p>
        </div>

        <form onSubmit={handleSubmit} className="motion-rise space-y-4">
          <Question title="How are you feeling overall?" icon={Smile}>
            <div className="grid gap-3 sm:grid-cols-3">
              <OptionTile active={feeling === "good"} onClick={() => setFeeling("good")} label="Good" icon={Smile} description="Mostly well today" />
              <OptionTile active={feeling === "okay"} onClick={() => setFeeling("okay")} label="Okay" icon={Meh} description="Usual symptoms" />
              <OptionTile tone="alert" active={feeling === "not_great"} onClick={() => setFeeling("not_great")} label="Not great" icon={Frown} description="Off or unwell" />
            </div>
          </Question>

          <p className="eyebrow pt-4">Warning signs</p>

          <Question title="Vaginal bleeding" hint="Have you noticed any bleeding today?" icon={Droplet}>
            <YesNoGrid value={bleeding} onChange={setBleeding} />
          </Question>

          <Question title="Severe headache" hint="A strong headache that won't go away?" icon={Brain}>
            <YesNoGrid value={severeHeadache} onChange={setSevereHeadache} />
          </Question>

          <Question title="Sudden swelling" hint="New swelling in your face or hands?" icon={Hand}>
            <YesNoGrid value={swelling} onChange={setSwelling} />
          </Question>

          {showMovement && (
            <Question title="Baby's movement" hint="Is the baby moving normally today?" icon={Activity}>
              <div className="grid grid-cols-3 gap-3">
                <OptionTile size="sm" active={fetalMovement === true} onClick={() => setFetalMovement(true)} label="Yes" />
                <OptionTile size="sm" tone="alert" active={fetalMovement === false} onClick={() => setFetalMovement(false)} label="No" />
                <OptionTile size="sm" active={fetalMovement === "na"} onClick={() => setFetalMovement("na")} label="Not sure" />
              </div>
            </Question>
          )}

          <p className="eyebrow pt-4">Vitals <span className="normal-case tracking-normal text-slate-500">— optional</span></p>

          <fieldset className="surface p-5 sm:p-6">
            <legend className="sr-only">Blood pressure</legend>
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-red-400 ring-1 ring-[var(--hairline)]">
                <HeartPulse className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-white">Blood pressure</p>
                <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">Only if you measured it today.</p>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="sys">Systolic</Label>
                <div className="relative">
                  <Input id="sys" type="number" inputMode="numeric" placeholder="120" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} className="num pr-14 text-lg font-semibold" />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">mmHg</span>
                </div>
              </div>
              <span className="pb-2.5 text-2xl font-light text-slate-600">/</span>
              <div className="flex-1 space-y-2">
                <Label htmlFor="dia">Diastolic</Label>
                <div className="relative">
                  <Input id="dia" type="number" inputMode="numeric" placeholder="80" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} className="num pr-14 text-lg font-semibold" />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">mmHg</span>
                </div>
              </div>
            </div>
          </fieldset>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <SubmitBar answered={answered} total={required.length} disabled={!isValid} submitting={submitting} />
        </form>
      </main>
    </div>
  )
}
