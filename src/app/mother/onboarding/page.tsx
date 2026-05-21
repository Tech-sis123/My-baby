"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Baby, HeartPulse, Link2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Choice = "pregnant" | "baby" | "both" | null

function OnboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forcedAdd = searchParams.get("add")
  const forcedChoice: Choice =
    forcedAdd === "pregnancy" ? "pregnant" : forcedAdd === "baby" ? "baby" : null

  const [choice, setChoice] = useState<Choice>(null)
  const [dueDate, setDueDate] = useState("")
  const [babyName, setBabyName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedChoice = forcedChoice || choice

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!selectedChoice) {
      setError("Choose whether you are pregnant, have a baby, or both.")
      return
    }
    if ((selectedChoice === "pregnant" || selectedChoice === "both") && !dueDate) {
      setError("Add your expected due date to continue.")
      return
    }
    if ((selectedChoice === "baby" || selectedChoice === "both") && !babyName.trim()) {
      setError("Add your baby's name to continue.")
      return
    }
    if ((selectedChoice === "baby" || selectedChoice === "both") && !birthDate) {
      setError("Add your baby's birth date to continue.")
      return
    }

    setLoading(true)
    setError("")

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
        setError(
          "Referral code not found. Leave it blank and continue without linking a doctor."
        )
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
        name: babyName.trim(),
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

  const optionClass = (value: Exclude<Choice, null>) =>
    cn(
      "rounded-2xl border p-4 text-left transition",
      selectedChoice === value
        ? "border-[rgba(201,139,88,0.5)] bg-[rgba(201,139,88,0.14)]"
        : "border-[var(--border)] bg-[rgba(255,248,239,0.04)] hover:border-[rgba(201,139,88,0.3)] hover:bg-[rgba(255,248,239,0.07)]"
    )

  const genderOptions = [
    { label: "Girl", value: "girl" },
    { label: "Boy", value: "boy" },
    { label: "Skip", value: "" },
  ]

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl">

        {/* Logo header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(199,143,98,0.35)] bg-[rgba(199,143,98,0.12)] text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
              MB
            </span>
            <span className="font-display text-lg font-semibold text-white">My Baby</span>
          </Link>
          <h1 className="text-3xl font-semibold text-white">
            {forcedChoice ? "Add a profile" : "Set up your care path"}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {forcedChoice
              ? `Adding a ${forcedChoice === "pregnant" ? "pregnancy" : "baby"} profile to your dashboard.`
              : "Choose the journey that matches your situation right now."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Choice cards */}
          {!forcedChoice && (
            <div className="grid gap-3 sm:grid-cols-3">
              <button type="button" className={optionClass("pregnant")} onClick={() => setChoice("pregnant")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,139,98,0.3)] bg-[rgba(201,139,88,0.12)]">
                  <HeartPulse className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <p className="mt-3 font-semibold text-white">I&apos;m pregnant</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Antenatal tracking
                </p>
              </button>

              <button type="button" className={optionClass("baby")} onClick={() => setChoice("baby")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,139,98,0.3)] bg-[rgba(201,139,88,0.12)]">
                  <Baby className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <p className="mt-3 font-semibold text-white">I have a baby</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Baby care & check-ins
                </p>
              </button>

              <button type="button" className={optionClass("both")} onClick={() => setChoice("both")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,139,98,0.3)] bg-[rgba(201,139,88,0.12)]">
                  <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <p className="mt-3 font-semibold text-white">Both</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Separate journeys
                </p>
              </button>
            </div>
          )}

          {/* Pregnancy fields */}
          {(selectedChoice === "pregnant" || selectedChoice === "both") && (
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.5)] p-5 space-y-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <HeartPulse className="h-3.5 w-3.5" /> Pregnancy details
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-[13px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Expected due date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Baby fields */}
          {(selectedChoice === "baby" || selectedChoice === "both") && (
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.5)] p-5 space-y-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Baby className="h-3.5 w-3.5" /> Baby details
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="babyName" className="text-[13px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Baby&apos;s name
                </Label>
                <Input
                  id="babyName"
                  value={babyName}
                  onChange={e => setBabyName(e.target.value)}
                  placeholder="Zara"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthDate" className="text-[13px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Birth date
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Gender (optional)
                </Label>
                <div className="flex gap-2">
                  {genderOptions.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
                        gender === opt.value
                          ? "border-[rgba(201,139,88,0.5)] bg-[rgba(201,139,88,0.14)] text-white"
                          : "border-[var(--border)] bg-[rgba(255,248,239,0.04)] text-[var(--muted-foreground)] hover:text-white"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Doctor code — always visible when a choice is made */}
          {selectedChoice && (
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.5)] p-5 space-y-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Link2 className="h-3.5 w-3.5" /> Doctor code (optional)
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                If your doctor gave you a referral code, enter it here. You can also add it later from your dashboard.
              </p>
              <Input
                id="inviteCode"
                placeholder="ADAEZE-2026"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="uppercase tracking-[0.2em]"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row pt-1">
            <Button
              type="submit"
              disabled={loading || !selectedChoice}
              className="sm:flex-1"
            >
              {loading
                ? "Saving…"
                : forcedChoice
                  ? "Save profile"
                  : "Continue to dashboard"}
            </Button>
            <Link href="/mother/home" className="sm:flex-1">
              <Button
                variant="outline"
                className="w-full border-[var(--border)] bg-transparent text-white"
              >
                Back to dashboard
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
          Loading…
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  )
}
