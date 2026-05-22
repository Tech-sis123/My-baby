"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, X } from "lucide-react"

const PREGNANCY_QUESTIONS = [
  { id: "feeling", text: "How are you feeling today?", options: ["good", "okay", "not_great"] },
  { id: "bleeding", text: "Have you experienced any vaginal bleeding?", options: ["yes", "no"] },
  { id: "severe_headache", text: "Do you have a severe headache that won't go away?", options: ["yes", "no"] },
  { id: "swelling", text: "Have you noticed sudden swelling in your face or hands?", options: ["yes", "no"] },
  { id: "fetal_movement", text: "Is the baby moving normally?", options: ["yes", "no", "not_sure"] },
]

const CHILD_QUESTIONS = [
  { id: "feeding", text: "How is the baby feeding?", options: ["breastmilk", "formula", "both", "struggling"] },
  { id: "fever", text: "Does the baby feel hot or have a fever?", options: ["yes", "no"] },
  { id: "breathing_normal", text: "Is the baby breathing comfortably?", options: ["yes", "no"] },
  { id: "mother_mood", text: "How are you feeling emotionally?", options: ["good", "okay", "overwhelmed"] },
]

interface Props {
  subjectType: "pregnancy" | "child"
  subjectId: string
  onCheckin: () => void
}

export function CheckinModal({ subjectType, subjectId, onCheckin }: Props) {
  const [open, setOpen] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [payload, setPayload] = useState<Record<string, any>>({})
  
  // Basic validation check
  const questions = subjectType === "pregnancy" ? PREGNANCY_QUESTIONS : CHILD_QUESTIONS
  const numberQuestions = subjectType === "pregnancy" 
    ? [{ id: "bp_systolic", text: "Blood Pressure (Top)", min: 80, max: 200 }, { id: "bp_diastolic", text: "Blood Pressure (Bottom)", min: 40, max: 130 }]
    : [{ id: "wet_diapers_24h", text: "Wet diapers in last 24h", min: 0, max: 20 }]

  const isFormValid = questions.every(q => payload[q.id] !== undefined) && 
    (subjectType === "child" ? payload["wet_diapers_24h"] !== undefined : true)

  async function handleSubmit() {
    if (!isFormValid || submitting) return
    setSubmitting(true)

    // Convert booleans for yes/no
    const finalPayload = { ...payload }
    for (const key in finalPayload) {
      if (finalPayload[key] === "yes") finalPayload[key] = true
      if (finalPayload[key] === "no") finalPayload[key] = false
    }

    const response = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_type: subjectType, subject_id: subjectId, payload: finalPayload }),
    })

    setSubmitting(false)
    if (response.ok) {
      setOpen(false)
      setAnimating(true)
      onCheckin()
      setTimeout(() => setAnimating(false), 2000)
      setPayload({}) // reset
    }
  }

  return (
    <div className="relative group sm:flex">
      <button 
        onClick={() => setOpen(true)} 
        disabled={submitting}
        className="group relative hidden sm:flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(199,143,98,0.3)] transition-all hover:bg-[var(--primary)]/90 hover:shadow-[0_0_25px_rgba(199,143,98,0.5)] disabled:opacity-50"
      >
        Check In Now
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Gold +1 Animation Layer */}
      {animating && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 font-bold text-yellow-400 animate-out slide-out-to-top-8 fade-out duration-1000 fill-mode-forwards drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] z-50">
          <span className="text-3xl">+1</span>
        </div>
      )}

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#1A1D23] shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Daily Check-in</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex flex-col gap-8">
                
                {/* Multiple Choice Questions */}
                {questions.map(q => (
                  <div key={q.id} className="space-y-3">
                    <label className="text-sm font-semibold text-gray-200">{q.text}</label>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setPayload(p => ({ ...p, [q.id]: opt }))}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                            payload[q.id] === opt
                              ? "border-[var(--primary)] bg-[var(--primary)]/20 text-[var(--primary)]"
                              : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {opt.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Number Inputs */}
                {numberQuestions.map(q => (
                  <div key={q.id} className="space-y-3">
                    <label className="text-sm font-semibold text-gray-200">{q.text}</label>
                    <Input
                      type="number"
                      min={q.min}
                      max={q.max}
                      placeholder={`e.g. ${q.min}`}
                      value={payload[q.id] || ""}
                      onChange={e => setPayload(p => ({ ...p, [q.id]: e.target.value ? Number(e.target.value) : undefined }))}
                      className="max-w-[120px] bg-black/20 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                    />
                  </div>
                ))}

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/5 bg-black/20 px-6 py-4">
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!isFormValid || submitting}
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 px-8"
              >
                {submitting ? "Submitting..." : "Complete Check-in"}
              </Button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}
