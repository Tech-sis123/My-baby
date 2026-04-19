"use client"
import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { HeartPulse, Link2, Sparkles } from "lucide-react"

type Choice = "pregnant" | "baby" | "both" | null

function OnboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [choice, setChoice] = useState<Choice>(null)
  const [dueDate, setDueDate] = useState("")
  const [babyName, setBabyName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const forcedChoice = useMemo<Choice>(() => {
    const add = searchParams.get("add")
    if (add === "pregnancy") return "pregnant"
    if (add === "baby") return "baby"
    return null
  }, [searchParams])

  const selectedChoice = forcedChoice || choice

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedChoice) return
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    let doctorId: string | null = null
    if (inviteCode.trim()) {
      const { data: doctor } = await supabase
        .from("doctors")
        .select("user_id")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .maybeSingle()

      if (!doctor) {
        setError("Referral code not found. Check the code and try again, or leave it blank to continue without a doctor.")
        setLoading(false)
        return
      }

      doctorId = doctor.user_id
    }

    if (selectedChoice === "pregnant" || selectedChoice === "both") {
      const { error: pregnancyError } = await supabase.from("pregnancies").insert({
        mother_id: user.id,
        due_date: dueDate,
        linked_doctor_id: doctorId,
      })
      if (pregnancyError) {
        setError(pregnancyError.message)
        setLoading(false)
        return
      }
    }

    if (selectedChoice === "baby" || selectedChoice === "both") {
      const { error: childError } = await supabase.from("children").insert({
        mother_id: user.id,
        name: babyName,
        birth_date: birthDate,
        gender: gender || null,
        linked_doctor_id: doctorId,
      })
      if (childError) {
        setError(childError.message)
        setLoading(false)
        return
      }
    }

    router.push("/mother/home")
  }

  const optionClass = (value: Choice) =>
    cn(
      "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all",
      selectedChoice === value
        ? "border-[#7dd3fc] bg-[rgba(14,116,144,0.18)] text-white"
        : "border-[var(--border)] bg-[rgba(8,17,31,0.66)] text-white hover:border-[#7dd3fc]"
    )

  const headline = selectedChoice === "baby"
    ? "Tell us about your baby"
    : selectedChoice === "pregnant"
      ? "Tell us about your pregnancy"
      : selectedChoice === "both"
        ? "Set up both journeys"
        : "What describes you right now?"

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_top,#fff3b0_0%,#ffc8ee_45%,#14b8a6_100%)] text-5xl shadow-[0_25px_50px_rgba(20,184,166,0.22)]">👶</div>
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b7f7ef]">
              <Sparkles className="h-3.5 w-3.5" /> Context-aware setup
            </div>
            <h1 className="text-4xl font-semibold text-white">{headline}</h1>
            <p className="mt-3 text-[var(--muted-foreground)]">Your dashboard, tips, and check-ins will follow what you choose here.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            <Card className="border-[var(--border)] bg-[rgba(8,17,31,0.76)] shadow-[0_30px_90px_rgba(8,17,31,0.28)]">
              <CardContent className="space-y-6 p-6 pt-6">
                {!forcedChoice && (
                  <div className="grid grid-cols-1 gap-3">
                    <button type="button" className={optionClass("pregnant")} onClick={() => setChoice("pregnant")}>
                      <span className="text-3xl">🤰</span>
                      <span className="font-semibold">I&apos;m pregnant</span>
                      <span className="text-sm text-[var(--muted-foreground)]">Track your pregnancy week by week</span>
                    </button>
                    <button type="button" className={optionClass("baby")} onClick={() => setChoice("baby")}>
                      <span className="text-3xl">🍼</span>
                      <span className="font-semibold">I have a baby</span>
                      <span className="text-sm text-[var(--muted-foreground)]">Track your baby&apos;s health and development</span>
                    </button>
                    <button type="button" className={optionClass("both")} onClick={() => setChoice("both")}>
                      <span className="text-3xl">🤰🍼</span>
                      <span className="font-semibold">Both — I&apos;m pregnant and have a baby</span>
                      <span className="text-sm text-[var(--muted-foreground)]">Track both at the same time</span>
                    </button>
                  </div>
                )}

                {(selectedChoice === "pregnant" || selectedChoice === "both") && (
                  <Card className="border-[rgba(125,211,252,0.2)] bg-[rgba(10,22,40,0.85)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">🤰 Your pregnancy</CardTitle>
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
                          className="bg-[rgba(8,17,31,0.45)] text-white"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(selectedChoice === "baby" || selectedChoice === "both") && (
                  <Card className="border-[rgba(244,114,182,0.2)] bg-[rgba(24,17,39,0.86)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">🍼 Your baby</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="babyName">Baby&apos;s name</Label>
                        <Input
                          id="babyName"
                          placeholder="Zara"
                          value={babyName}
                          onChange={e => setBabyName(e.target.value)}
                          required
                          className="bg-[rgba(8,17,31,0.45)] text-white"
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
                          className="bg-[rgba(8,17,31,0.45)] text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="gender">Gender <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
                        <div className="flex gap-2">
                          {["Girl", "Boy", "Prefer not to say"].map(option => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setGender(option === "Prefer not to say" ? "" : option.toLowerCase())}
                              className={cn(
                                "flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all",
                                gender === (option === "Prefer not to say" ? "" : option.toLowerCase())
                                  ? "border-[#f9a8d4] bg-[rgba(244,114,182,0.12)] text-white"
                                  : "border-[var(--border)] bg-[rgba(8,17,31,0.45)] text-white"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedChoice && (
                  <div className="space-y-1">
                    <Label htmlFor="inviteCode">
                      Doctor referral code <span className="font-normal text-[var(--muted-foreground)]">(optional)</span>
                    </Label>
                    <Input
                      id="inviteCode"
                      placeholder="e.g. ADAEZE-2026"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      className="bg-[rgba(8,17,31,0.45)] uppercase tracking-[0.2em] text-white"
                    />
                    <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <Link2 className="h-3.5 w-3.5" /> Add this if your doctor gave you one so your check-ins show on their dashboard.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading || !selectedChoice}>
                  {loading ? "Saving…" : forcedChoice ? "Save and return to dashboard" : "Continue to dashboard"}
                </Button>
                <p className="text-center text-xs text-[var(--muted-foreground)]">
                  You can always add the other journey later from your dashboard.
                </p>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="space-y-4">
          <Card className="border-[var(--border)] bg-[rgba(8,17,31,0.74)]">
            <CardContent className="p-6 pt-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[#9ae6de]">
                <HeartPulse className="h-4 w-4" /> How this works
              </div>
              <div className="mt-4 space-y-3 text-sm text-[var(--muted-foreground)]">
                <p>If you choose pregnancy, your home page focuses on antenatal tracking and weekly tips.</p>
                <p>If you choose baby, your home page focuses on feeding, diapers, breathing, and baby-specific guidance.</p>
                <p>If you choose both, the dashboard keeps both journeys separate so they do not mix together.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[rgba(8,17,31,0.74)]">
            <CardContent className="p-6 pt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-200">Need something else?</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">You can return to your dashboard without adding another profile now.</p>
              <Link href="/mother/home" className="mt-4 inline-flex">
                <Button variant="outline" className="bg-transparent text-white">Back to dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">Loading…</div>}>
      <OnboardingPageContent />
    </Suspense>
  )
}
