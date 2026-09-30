"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Baby, HeartPulse, Link2, LoaderCircle, Sparkles } from "lucide-react"
import { Brand } from "@/components/app/brand"
import { OptionTile } from "@/components/app/option-tile"
import { Notice } from "@/components/app/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

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

  const genderOptions = [
    { label: "Girl", value: "girl" },
    { label: "Boy", value: "boy" },
    { label: "Skip", value: "" },
  ]

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--hairline)]">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4 sm:px-6">
          <Brand href="/mother/home" />
          <Link href="/mother/home" className="text-sm text-[var(--muted-foreground)] hover:text-white">
            Skip for now
          </Link>
        </div>
      </header>

      <div className="motion-rise mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="eyebrow text-[var(--primary)]">{forcedChoice ? "New profile" : "Getting started"}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {forcedChoice ? `Add a ${forcedChoice === "pregnant" ? "pregnancy" : "baby"} profile` : "Set up your care path"}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            {forcedChoice
              ? "We'll tailor check-ins and weekly guidance to this profile."
              : "Choose what matches your situation. You can add more profiles later."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!forcedChoice && (
            <div role="radiogroup" aria-label="Care path" className="grid gap-3">
              <OptionTile active={selectedChoice === "pregnant"} onClick={() => setChoice("pregnant")} icon={HeartPulse} label="I'm pregnant" description="Antenatal tracking and weekly guidance" />
              <OptionTile active={selectedChoice === "baby"} onClick={() => setChoice("baby")} icon={Baby} label="I have a baby" description="Feeding, hydration and newborn check-ins" />
              <OptionTile active={selectedChoice === "both"} onClick={() => setChoice("both")} icon={Sparkles} label="Both" description="Track a pregnancy and a baby separately" />
            </div>
          )}

          {(selectedChoice === "pregnant" || selectedChoice === "both") && (
            <section className="surface space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <HeartPulse className="h-4 w-4 text-[var(--primary)]" /> Pregnancy details
              </h2>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Expected due date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </section>
          )}

          {(selectedChoice === "baby" || selectedChoice === "both") && (
            <section className="surface space-y-4 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Baby className="h-4 w-4 text-[var(--primary)]" /> Baby details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="babyName">Baby&apos;s name</Label>
                  <Input id="babyName" value={babyName} onChange={e => setBabyName(e.target.value)} placeholder="Zara" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth date</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sex <span className="font-normal text-slate-500">(optional)</span></Label>
                <div role="radiogroup" aria-label="Sex" className="grid grid-cols-3 gap-2">
                  {genderOptions.map(opt => (
                    <OptionTile key={opt.label} size="sm" active={gender === opt.value} onClick={() => setGender(opt.value)} label={opt.label} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {selectedChoice && (
            <section className="surface space-y-3 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Link2 className="h-4 w-4 text-[var(--primary)]" /> Doctor referral code
                <span className="font-normal text-slate-500">(optional)</span>
              </h2>
              <p className="text-[13px] text-[var(--muted-foreground)]">
                If your doctor gave you a code, enter it so they can see your check-ins. You can also add it later.
              </p>
              <Input
                id="inviteCode"
                aria-label="Doctor referral code"
                placeholder="ADAEZE-2026"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono uppercase tracking-wider"
              />
            </section>
          )}

          {error && <Notice tone="error">{error}</Notice>}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Link href="/mother/home">
              <Button type="button" variant="ghost" className="w-full">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading || !selectedChoice}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Saving…" : forcedChoice ? "Save profile" : "Continue to dashboard"}
            </Button>
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
