"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Baby,
  CalendarDays,
  HeartPulse,
  Link2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Choice = "pregnant" | "baby" | "both" | null

function choiceSummary(choice: Choice) {
  if (choice === "pregnant") {
    return {
      title: "Pregnancy care mode",
      body: "Your dashboard will focus on antenatal check-ins, pregnancy tips, and symptom tracking.",
      steps: ["Pregnancy check-ins", "Weekly guidance", "Doctor linking on pregnancy track"],
    }
  }

  if (choice === "baby") {
    return {
      title: "Baby care mode",
      body: "Your dashboard will focus on feeding, diapers, breathing, appointments, and baby-specific support.",
      steps: ["Baby check-ins", "Age-based care tips", "Doctor linking on baby track"],
    }
  }

  if (choice === "both") {
    return {
      title: "Dual care mode",
      body: "Pregnancy and baby journeys stay separate, but both appear inside one dashboard so context does not get mixed.",
      steps: ["Pregnancy and baby cards", "Separate check-ins", "One doctor can follow both"],
    }
  }

  return {
    title: "Choose your care path",
    body: "This decides what appears on your home screen, what check-ins you get, and what tips stay visible first.",
    steps: ["Pick your path", "Add core details", "Optionally link your doctor"],
  }
}

function OnboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forcedAdd = searchParams.get("add")
  const forcedChoice: Choice = forcedAdd === "pregnancy" ? "pregnant" : forcedAdd === "baby" ? "baby" : null

  const [choice, setChoice] = useState<Choice>(null)
  const [dueDate, setDueDate] = useState("")
  const [babyName, setBabyName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedChoice = forcedChoice || choice
  const summary = choiceSummary(selectedChoice)

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
        setError("Referral code not found. Check it again or leave it blank and continue without linking a doctor.")
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
      "rounded-[1.6rem] border p-5 text-left transition",
      selectedChoice === value
        ? "border-[rgba(201,139,88,0.34)] bg-[rgba(201,139,88,0.12)]"
        : "border-[var(--border)] bg-[rgba(255,248,239,0.05)] hover:border-[rgba(201,139,88,0.28)] hover:bg-[rgba(255,248,239,0.08)]"
    )

  const genderOptions = [
    { label: "Girl", value: "girl" },
    { label: "Boy", value: "boy" },
    { label: "Prefer not to say", value: "" },
  ]

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[1.16fr_0.84fr]">
        <section className="space-y-6">
          <section className="panel-float overflow-hidden rounded-[2.25rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                  <Sparkles className="h-3.5 w-3.5" /> Context-aware onboarding
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Set up the right care path before the dashboard starts making decisions for you.
                </h1>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  Choose the journey that matches your real situation right now. The platform will keep pregnancy support and baby support in the right context instead of mixing them together.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      <HeartPulse className="h-4 w-4" /> Care path
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white">Pregnancy, baby, or both.</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      <Stethoscope className="h-4 w-4" /> Doctor linkage
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white">Connect with an invite code now or later.</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      <ShieldCheck className="h-4 w-4" /> Dashboard focus
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white">Your tips, check-ins, and prompts follow this setup.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
                <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    <Sparkles className="h-4 w-4" /> What this unlocks
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold text-white">{summary.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{summary.body}</p>

                  <div className="mt-5 space-y-3">
                    {summary.steps.map(step => (
                      <div
                        key={step}
                        className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">Setup flow</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  {forcedChoice ? "Add the next profile" : "Choose your care context"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  The content shown after this step depends on what you choose here.
                </p>
              </div>

              {forcedChoice ? (
                <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                  Adding {forcedChoice === "pregnant" ? "pregnancy" : "baby"} profile
                </div>
              ) : null}
            </div>

            {!forcedChoice ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <button type="button" className={optionClass("pregnant")} onClick={() => setChoice("pregnant")}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,139,88,0.3)] bg-[rgba(201,139,88,0.12)] text-[var(--foreground)]">
                      <HeartPulse className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">I&apos;m pregnant</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Antenatal tracking and pregnancy guidance</p>
                    </div>
                  </div>
                </button>

                <button type="button" className={optionClass("baby")} onClick={() => setChoice("baby")}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,139,88,0.3)] bg-[rgba(201,139,88,0.12)] text-[var(--foreground)]">
                      <Baby className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">I have a baby</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Baby check-ins, feeding, diapers, and care tips</p>
                    </div>
                  </div>
                </button>

                <button type="button" className={optionClass("both")} onClick={() => setChoice("both")}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,139,88,0.3)] bg-[rgba(201,139,88,0.12)] text-[var(--foreground)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">I&apos;m pregnant and I have a baby</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Keep both journeys active without mixing the context</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : null}

            {selectedChoice ? (
              <div className="mt-6 grid gap-6 2xl:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-6">
                  {selectedChoice === "pregnant" || selectedChoice === "both" ? (
                    <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                        <HeartPulse className="h-4 w-4" /> Pregnancy details
                      </div>
                      <div className="mt-5 space-y-2">
                        <Label htmlFor="dueDate" className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          Expected due date
                        </Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={dueDate}
                          onChange={event => setDueDate(event.target.value)}
                        />
                      </div>
                    </section>
                  ) : null}

                  {selectedChoice === "baby" || selectedChoice === "both" ? (
                    <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                        <Baby className="h-4 w-4" /> Baby details
                      </div>
                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2 lg:col-span-2">
                          <Label htmlFor="babyName" className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                            Baby&apos;s name
                          </Label>
                          <Input
                            id="babyName"
                            value={babyName}
                            onChange={event => setBabyName(event.target.value)}
                            placeholder="Zara"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="birthDate" className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                            Birth date
                          </Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={birthDate}
                            onChange={event => setBirthDate(event.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                            Gender
                          </Label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {genderOptions.map(option => (
                              <button
                                key={option.label}
                                type="button"
                                onClick={() => setGender(option.value)}
                                className={cn(
                                  "rounded-xl border px-3 py-2 text-sm font-medium transition",
                                  gender === option.value
                                    ? "border-[rgba(201,139,88,0.34)] bg-[rgba(201,139,88,0.12)] text-white"
                                    : "border-[var(--border)] bg-[rgba(255,248,239,0.04)] text-[var(--muted-foreground)] hover:text-white"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      <Link2 className="h-4 w-4" /> Doctor linkage
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                      If your doctor gave you a referral code, enter it here so your check-ins can appear on their dashboard immediately.
                    </p>

                    <div className="mt-5 space-y-2">
                      <Label htmlFor="inviteCode" className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Referral code
                      </Label>
                      <Input
                        id="inviteCode"
                        placeholder="ADAEZE-2026"
                        value={inviteCode}
                        onChange={event => setInviteCode(event.target.value.toUpperCase())}
                        className="uppercase tracking-[0.22em]"
                      />
                    </div>
                  </section>

                  <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      <CalendarDays className="h-4 w-4" /> After setup
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white">
                        Your home screen switches to the correct care context.
                      </div>
                      <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white">
                        Check-ins and quick tips stay relevant to what you selected here.
                      </div>
                      <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white">
                        You can add the other journey later without losing this setup.
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={loading || !selectedChoice} className="sm:flex-1">
                {loading ? "Saving your setup" : forcedChoice ? "Save profile" : "Continue to dashboard"}
              </Button>
              <Link href="/mother/home" className="sm:flex-1">
                <Button variant="outline" className="w-full border-[var(--border)] bg-transparent text-white">
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <ShieldCheck className="h-4 w-4" /> Why this step matters
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                <p className="text-sm leading-6 text-white">
                  If you choose baby only, the platform should not keep showing pregnancy-first suggestions.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                <p className="text-sm leading-6 text-white">
                  If you choose pregnancy only, your quick tips and check-ins should stay focused on your pregnancy.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                <p className="text-sm leading-6 text-white">
                  If you choose both, each journey should keep its own context instead of blending together.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <Link2 className="h-4 w-4" /> Doctor code reminder
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
              No code yet? Continue anyway. You can still link a doctor later from the mother dashboard on each pregnancy or baby track.
            </p>
          </section>
        </aside>
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
