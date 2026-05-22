"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, HeartPulse, ShieldCheck, Check, Activity, Smile, Frown, Meh, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MedicalFooter } from "@/components/medical-footer"
import { cn } from "@/lib/utils"

type Feeling = "good" | "okay" | "not_great"
type YesNo = boolean | null
type Movement = boolean | "na" | null

function PremiumToggle({
  active,
  onClick,
  label,
  icon: Icon,
  description,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: any
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300",
        active
          ? "border-[var(--primary)] bg-[var(--primary)]/15 shadow-[0_0_20px_rgba(199,143,98,0.15)] scale-[1.02]"
          : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:scale-[1.01]"
      )}
    >
      {active && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] shadow-[0_0_10px_rgba(199,143,98,0.5)]">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-1 sm:mb-2">
        {Icon && <Icon className={cn("h-6 w-6 transition-colors", active ? "text-[var(--primary)]" : "text-gray-400")} />}
        <p className={cn("text-base sm:text-lg font-semibold transition-colors", active ? "text-white" : "text-gray-300")}>{label}</p>
      </div>
      {description && <p className="text-xs sm:text-sm text-gray-400 mt-2">{description}</p>}
    </button>
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
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
      alert("Check-in failed. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[#0E1116] selection:bg-[var(--primary)]/30">
      {/* Sleek Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 px-4 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--primary)]">Pregnancy Check-in</p>
            <h1 className="text-lg font-semibold text-white">Daily Review {weekLabel && <span className="text-gray-400 font-normal">· {weekLabel}</span>}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Section: Feeling */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">How are you feeling today?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PremiumToggle active={feeling === "good"} onClick={() => setFeeling("good")} label="Good" icon={Smile} description="I feel mostly well today." />
              <PremiumToggle active={feeling === "okay"} onClick={() => setFeeling("okay")} label="Okay" icon={Meh} description="Manageable, just standard symptoms." />
              <PremiumToggle active={feeling === "not_great"} onClick={() => setFeeling("not_great")} label="Not Great" icon={Frown} description="I feel off or unwell today." />
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Section: Symptoms */}
          <section className="space-y-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Any unusual symptoms?</h2>
            
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">Vaginal Bleeding</h3>
                  <p className="text-sm text-gray-400 mt-1">Have you noticed any bleeding today?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PremiumToggle active={bleeding === true} onClick={() => setBleeding(true)} label="Yes" />
                  <PremiumToggle active={bleeding === false} onClick={() => setBleeding(false)} label="No" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">Severe Headache</h3>
                  <p className="text-sm text-gray-400 mt-1">Do you have a strong headache that won't go away?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PremiumToggle active={severeHeadache === true} onClick={() => setSevereHeadache(true)} label="Yes" />
                  <PremiumToggle active={severeHeadache === false} onClick={() => setSevereHeadache(false)} label="No" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">Sudden Swelling</h3>
                  <p className="text-sm text-gray-400 mt-1">Have you noticed sudden swelling in your face or hands?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PremiumToggle active={swelling === true} onClick={() => setSwelling(true)} label="Yes" />
                  <PremiumToggle active={swelling === false} onClick={() => setSwelling(false)} label="No" />
                </div>
              </div>
            </div>
          </section>

          {/* Fetal Movement */}
          {showMovement && (
            <>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Baby's Activity</h2>
                <div className="rounded-[2rem] border border-white/5 bg-[var(--primary)]/5 p-6 sm:p-8 backdrop-blur-xl">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[var(--primary)]" />
                      Fetal Movement
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Is the baby moving normally today?</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PremiumToggle active={fetalMovement === true} onClick={() => setFetalMovement(true)} label="Yes" />
                    <PremiumToggle active={fetalMovement === false} onClick={() => setFetalMovement(false)} label="No" />
                    <PremiumToggle active={fetalMovement === "na"} onClick={() => setFetalMovement("na")} label="Not Sure" />
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Vitals */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Vitals (Optional)</h2>
            <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
               <div className="flex items-center gap-2 mb-6">
                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                   <HeartPulse className="h-5 w-5 text-red-400" />
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold text-white">Blood Pressure</h3>
                   <p className="text-xs text-gray-400 mt-0.5">Enter if you measured today.</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <div className="flex-1">
                   <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Systolic (Top)</label>
                   <Input
                     type="number"
                     placeholder="120"
                     value={bpSystolic}
                     onChange={e => setBpSystolic(e.target.value)}
                     className="h-14 bg-white/5 border-white/10 text-xl text-white focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]"
                   />
                 </div>
                 <div className="text-3xl font-light text-gray-600 mt-6">/</div>
                 <div className="flex-1">
                   <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Diastolic (Bottom)</label>
                   <Input
                     type="number"
                     placeholder="80"
                     value={bpDiastolic}
                     onChange={e => setBpDiastolic(e.target.value)}
                     className="h-14 bg-white/5 border-white/10 text-xl text-white focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]"
                   />
                 </div>
               </div>
            </div>
          </section>

          {/* Submit Action */}
          <div className="pt-8 pb-12 sticky bottom-0 z-10 bg-gradient-to-t from-[#0E1116] via-[#0E1116] to-transparent">
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full h-16 rounded-full bg-[var(--primary)] text-lg font-bold text-white shadow-[0_0_40px_rgba(199,143,98,0.4)] transition-all hover:bg-[var(--primary)]/90 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 group"
            >
              {submitting ? "Saving Check-in..." : "Complete Check-in"}
              {!submitting && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
            </Button>
          </div>

        </form>
      </main>
    </div>
  )
}
