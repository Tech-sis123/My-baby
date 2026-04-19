"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Choice = "pregnant" | "baby" | "both" | null

export default function OnboardingPage() {
  const router = useRouter()
  const [choice, setChoice] = useState<Choice>(null)
  const [dueDate, setDueDate] = useState("")
  const [babyName, setBabyName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [useDemo, setUseDemo] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!choice && !useDemo) return
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    if (useDemo) {
      // Create demo pregnancy with check-in history
      const today = new Date()
      const dueDate = new Date(today.getTime() + 56 * 86400000).toISOString().split('T')[0]
      
      const { data: pregData, error: pregError } = await supabase
        .from("pregnancies")
        .insert({ mother_id: user.id, due_date: dueDate, status: "active" })
        .select()
      
      if (pregError) { setError(pregError.message); setLoading(false); return }
      
      if (pregData?.[0]) {
        // Add sample check-ins
        const sampleCheckins = [
          { daysAgo: 3, feeling: "good", bp_systolic: 120, bp_diastolic: 78 },
          { daysAgo: 2, feeling: "good", bp_systolic: 119, bp_diastolic: 77 },
          { daysAgo: 1, feeling: "okay", bp_systolic: 120, bp_diastolic: 78 },
          { daysAgo: 0, feeling: "good", bp_systolic: 118, bp_diastolic: 76 },
        ]
        
        for (const checkin of sampleCheckins) {
          const createdAt = new Date(today.getTime() - checkin.daysAgo * 86400000).toISOString()
          await supabase.from("checkins").insert({
            mother_id: user.id,
            subject_type: "pregnancy",
            subject_id: pregData[0].id,
            payload: { feeling: checkin.feeling, bp_systolic: checkin.bp_systolic, bp_diastolic: checkin.bp_diastolic, bleeding: false, severe_headache: false, swelling: false, fetal_movement: true },
            created_at: createdAt,
          })
        }
      }
    } else {
      let doctorId: string | null = null
      if (inviteCode.trim()) {
        const { data: doctor } = await supabase
          .from("doctors")
          .select("user_id")
          .eq("invite_code", inviteCode.trim().toUpperCase())
          .single()
        if (!doctor) {
          setError("Invite code not found. Check the code and try again, or leave it blank to continue without a doctor.")
          setLoading(false)
          return
        }
        doctorId = doctor.user_id
      }

      if (choice === "pregnant" || choice === "both") {
        const { error: pregError } = await supabase.from("pregnancies").insert({
          mother_id: user.id,
          due_date: dueDate,
          linked_doctor_id: doctorId,
        })
        if (pregError) { setError(pregError.message); setLoading(false); return }
      }

      if (choice === "baby" || choice === "both") {
        const { error: childError } = await supabase.from("children").insert({
          mother_id: user.id,
          name: babyName,
          birth_date: birthDate,
          gender: gender || null,
          linked_doctor_id: doctorId,
        })
        if (childError) { setError(childError.message); setLoading(false); return }
      }
    }

    router.push("/mother/home")
  }

  const optionClass = (val: Choice) =>
    cn(
      "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all text-center",
      choice === val
        ? "border-[var(--primary)] bg-purple-50"
        : "border-[var(--border)] bg-white hover:border-purple-300"
    )

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💜</div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">What describes you right now?</h1>
          <p className="text-[var(--muted-foreground)] mt-2">We'll set up your experience from here.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Demo Button */}
          {!choice && !useDemo && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Button
                type="button"
                onClick={() => setUseDemo(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                ✨ Try Demo Data
              </Button>
              <p className="text-xs text-gray-600 text-center mt-2">See sample pregnancy data and check-in history</p>
            </div>
          )}

          {useDemo ? (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base">Demo Data Ready!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">Sample pregnancy data loaded:</p>
                <ul className="text-sm space-y-1 mb-4 text-gray-700">
                  <li>✓ 32 weeks pregnant pregnancy</li>
                  <li>✓ 4 sample check-ins with health metrics</li>
                  <li>✓ Ready to explore the app</li>
                </ul>
                <Button type="submit" className="w-full">Continue to Dashboard</Button>
                <Button type="button" onClick={() => setUseDemo(false)} variant="outline" className="w-full mt-2">
                  Back
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Choice selector */}
              <div className="grid grid-cols-1 gap-3">
                <button type="button" className={optionClass("pregnant")} onClick={() => setChoice("pregnant")}>
                  <span className="text-3xl">🤰</span>
                  <span className="font-semibold text-[var(--foreground)]">I'm pregnant</span>
                  <span className="text-sm text-[var(--muted-foreground)]">Track your pregnancy week by week</span>
                </button>
                <button type="button" className={optionClass("baby")} onClick={() => setChoice("baby")}>
                  <span className="text-3xl">🍼</span>
                  <span className="font-semibold text-[var(--foreground)]">I have a baby</span>
                  <span className="text-sm text-[var(--muted-foreground)]">Track your baby's health and development</span>
                </button>
                <button type="button" className={optionClass("both")} onClick={() => setChoice("both")}>
                  <span className="text-3xl">🤰🍼</span>
                  <span className="font-semibold text-[var(--foreground)]">Both — I'm pregnant and have a baby</span>
                  <span className="text-sm text-[var(--muted-foreground)]">Track both at the same time</span>
                </button>
              </div>

              {/* Pregnancy fields */}
              {(choice === "pregnant" || choice === "both") && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">🤰 Your pregnancy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="dueDate">Expected due date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Baby fields */}
              {(choice === "baby" || choice === "both") && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">🍼 Your baby</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="babyName">Baby's name</Label>
                      <Input
                        id="babyName"
                        placeholder="Zara"
                        value={babyName}
                        onChange={e => setBabyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="birthDate">Birth date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gender">Gender <span className="text-[var(--muted-foreground)] font-normal">(optional)</span></Label>
                      <div className="flex gap-2">
                        {["Girl", "Boy", "Prefer not to say"].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g === "Prefer not to say" ? "" : g.toLowerCase())}
                            className={cn(
                              "flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all",
                              gender === (g === "Prefer not to say" ? "" : g.toLowerCase())
                                ? "border-[var(--primary)] bg-purple-50 text-[var(--primary)]"
                                : "border-[var(--border)] bg-white text-[var(--foreground)]"
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invite code */}
              {choice && (
                <div className="space-y-1">
                  <Label htmlFor="inviteCode">
                    Doctor invite code <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="inviteCode"
                    placeholder="e.g. ADAEZE-2026"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    className="uppercase tracking-widest"
                  />
                  <p className="text-xs text-[var(--muted-foreground)]">Ask your doctor or midwife for their code. You can add this later too.</p>
                </div>
              )}

              {error && (
                <p className="text-sm text-[var(--destructive)] bg-red-50 p-3 rounded-xl">{error}</p>
              )}

              {choice && (
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Setting up your profile…" : "Continue →"}
                </Button>
              )}
            </>
          )}

          {error && !useDemo && !choice && (
            <p className="text-sm text-[var(--destructive)] bg-red-50 p-3 rounded-xl">{error}</p>
          )}

          {(useDemo || choice) && (
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Setting up your profile…" : "Continue →"}
            </Button>
          )}
        </form>
      </div>
    </main>
  )
}
