"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Baby, Droplets, Thermometer, Wind, Heart, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MedicalFooter } from "@/components/medical-footer"
import { cn } from "@/lib/utils"

type Mood = "good" | "okay" | "low" | "very_low"
type Feeding = "breastmilk" | "formula" | "both" | "solids"

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

  const isValid = feeding !== null && wetDiapers !== "" && fever !== null && breathingNormal !== null && motherMood !== null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
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
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--primary)]">Baby Check-in</p>
            <h1 className="text-lg font-semibold text-white">Daily Baby Review</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Feeding & Diapers */}
          <section className="space-y-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Nutrition & Hydration</h2>
            
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/10">
                    <Baby className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Feeding Method</h3>
                    <p className="text-sm text-gray-400 mt-1">How is the baby feeding today?</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PremiumToggle active={feeding === "breastmilk"} onClick={() => setFeeding("breastmilk")} label="Breastmilk" />
                  <PremiumToggle active={feeding === "formula"} onClick={() => setFeeding("formula")} label="Formula" />
                  <PremiumToggle active={feeding === "both"} onClick={() => setFeeding("both")} label="Both" />
                  <PremiumToggle active={feeding === "solids"} onClick={() => setFeeding("solids")} label="Solids" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <Droplets className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Wet Diapers</h3>
                    <p className="text-sm text-gray-400 mt-1">How many wet diapers in the last 24 hours?</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-6 py-4">
                  <button
                    type="button"
                    onClick={() => setWetDiapers(value => String(Math.max(0, Number(value || 0) - 1)))}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-light text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={wetDiapers}
                    onChange={e => setWetDiapers(e.target.value)}
                    className="h-20 w-32 bg-transparent border-none text-center text-5xl font-bold text-white focus-visible:ring-0 p-0"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => setWetDiapers(value => String(Number(value || 0) + 1))}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-light text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  >
                    +
                  </button>
                </div>
                {Number(wetDiapers) < 6 && wetDiapers !== "" && (
                  <p className="mt-4 text-center text-sm font-medium text-yellow-400 bg-yellow-400/10 py-2 rounded-xl border border-yellow-400/20">
                    Fewer than 6 wet diapers can be worth paying attention to.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Health & Breathing */}
          <section className="space-y-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Health & Breathing</h2>
            
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                    <Thermometer className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Fever Check</h3>
                    <p className="text-sm text-gray-400 mt-1">Does the baby feel hot or have a fever?</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <PremiumToggle active={fever === true} onClick={() => setFever(true)} label="Yes" />
                  <PremiumToggle active={fever === false} onClick={() => { setFever(false); setTemp(""); }} label="No" />
                </div>
                
                {fever && (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Temperature (°C) - Optional</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 38.5"
                      value={temp}
                      onChange={e => setTemp(e.target.value)}
                      className="h-14 max-w-[200px] bg-white/5 border-white/10 text-xl text-white focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-6 sm:p-8 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
                    <Wind className="h-5 w-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Breathing</h3>
                    <p className="text-sm text-gray-400 mt-1">Is the baby breathing comfortably?</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PremiumToggle active={breathingNormal === true} onClick={() => setBreathingNormal(true)} label="Yes" />
                  <PremiumToggle active={breathingNormal === false} onClick={() => setBreathingNormal(false)} label="No" />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Mother Mood */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Your Wellbeing</h2>
            <div className="rounded-[2rem] border border-white/5 bg-[var(--primary)]/5 p-6 sm:p-8 backdrop-blur-xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/20">
                   <Heart className="h-5 w-5 text-[var(--primary)]" />
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold text-white">How are you feeling emotionally?</h3>
                   <p className="text-sm text-gray-400 mt-1">Your wellbeing is part of the full care picture.</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <PremiumToggle active={motherMood === "good"} onClick={() => setMotherMood("good")} label="Good" />
                 <PremiumToggle active={motherMood === "okay"} onClick={() => setMotherMood("okay")} label="Okay" />
                 <PremiumToggle active={motherMood === "low"} onClick={() => setMotherMood("low")} label="Low" />
                 <PremiumToggle active={motherMood === "very_low"} onClick={() => setMotherMood("very_low")} label="Very Low" />
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
