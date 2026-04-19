"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Link2, LoaderCircle, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildDefaultInviteCode, normalizeInviteCode } from "@/lib/account"
import { createClient } from "@/lib/supabase/client"
import { CopyCodeButton } from "./copy-button"

interface Props {
  userId: string
  displayName: string
  currentCode: string
  specialty: string | null
  clinicName: string | null
}

export function ReferralCodeManager({ userId, displayName, currentCode, specialty, clinicName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [desiredCode, setDesiredCode] = useState(currentCode)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const suggestedCode = buildDefaultInviteCode(displayName, userId)
  const normalizedPreview = normalizeInviteCode(desiredCode || suggestedCode)

  async function saveCode(rawValue: string) {
    const normalized = normalizeInviteCode(rawValue)

    if (!normalized || normalized.length < 4) {
      setError("Use at least 4 letters or numbers for the referral code.")
      setSuccess("")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    const { data: conflict } = await supabase
      .from("doctors")
      .select("user_id")
      .eq("invite_code", normalized)
      .maybeSingle()

    if (conflict && conflict.user_id !== userId) {
      setError("That referral code is already in use. Try another one.")
      setLoading(false)
      return
    }

    const { error: saveError } = await supabase.from("doctors").upsert(
      {
        user_id: userId,
        invite_code: normalized,
        specialty,
        clinic_name: clinicName,
      },
      { onConflict: "user_id" }
    )

    if (saveError) {
      setError(saveError.message)
      setLoading(false)
      return
    }

    setDesiredCode(normalized)
    setSuccess("Referral code saved. Mothers can use it immediately.")
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
          <Link2 className="h-4 w-4" /> Current referral code
        </div>

        <div className="mt-5 rounded-[1.65rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(42,34,28,0.42)] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Active code</p>
          <p className="mt-4 break-all text-4xl font-semibold tracking-[0.24em] text-white">{currentCode}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            This is the exact value a mother enters to link herself, her pregnancy, or her baby-care track back to your dashboard.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Best use</p>
              <p className="mt-2 text-sm leading-6 text-white">
                Share it verbally, print it on intake slips, or send it in a simple message.
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">What happens next</p>
              <p className="mt-2 text-sm leading-6 text-white">
                New check-ins from linked pregnancy and baby tracks start surfacing in your doctor workflow.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <CopyCodeButton code={currentCode} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
          <Sparkles className="h-4 w-4" /> Customize the code
        </div>
        <h3 className="mt-3 text-3xl font-semibold text-white">Pick something mothers will remember</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          Use your surname, short clinic name, or a concise professional handle. The system normalizes it into a clean all-caps referral code.
        </p>

        <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
          <label htmlFor="desiredCode" className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Referral code input
          </label>
          <Input
            id="desiredCode"
            value={desiredCode}
            onChange={event => setDesiredCode(event.target.value.toUpperCase())}
            placeholder={suggestedCode}
            className="mt-3 uppercase tracking-[0.24em]"
          />

          <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Live preview</p>
            <p className="mt-2 break-all text-2xl font-semibold tracking-[0.18em] text-white">{normalizedPreview}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDesiredCode(suggestedCode)}
              className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              Suggested: {suggestedCode}
            </button>
            {clinicName ? (
              <button
                type="button"
                onClick={() => setDesiredCode(clinicName)}
                className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
              >
                Clinic: {normalizeInviteCode(clinicName)}
              </button>
            ) : null}
            {specialty ? (
              <button
                type="button"
                onClick={() => setDesiredCode(`${displayName}-${specialty}`)}
                className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
              >
                Name + specialty
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-[1.25rem] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => saveCode(desiredCode)} disabled={loading} className="sm:flex-1">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Saving referral code" : "Save referral code"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDesiredCode(suggestedCode)
              setError("")
              setSuccess("")
            }}
            className="border-[var(--border)] bg-transparent text-white sm:flex-1"
          >
            <RefreshCw className="h-4 w-4" /> Use suggested code
          </Button>
        </div>
      </section>
    </div>
  )
}
