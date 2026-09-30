"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Link2, LoaderCircle, RefreshCw } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Notice } from "@/components/app/status"
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

  const chip =
    "rounded-md border border-[var(--border)] px-2.5 py-1 font-mono text-xs text-slate-400 hover:border-slate-500 hover:text-white"

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-[var(--hairline)] px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Link2 className="h-4 w-4 text-[var(--primary)]" /> Referral code
        </h2>
        <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
          Mothers enter this code to link their pregnancy or baby profile to your dashboard.
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        {/* Current code */}
        <div className="surface-sunken flex flex-col justify-between p-5">
          <div>
            <p className="data-label">Active code</p>
            <p className="mt-2 break-all font-mono text-3xl font-semibold tracking-wider text-white">{currentCode}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              Share it verbally, print it on intake slips, or send it by message. New check-ins from linked profiles appear on your triage board.
            </p>
          </div>
          <div className="mt-5">
            <CopyCodeButton code={currentCode} />
          </div>
        </div>

        {/* Customize */}
        <div>
          <Label htmlFor="desiredCode">Customize code</Label>
          <Input
            id="desiredCode"
            value={desiredCode}
            onChange={event => setDesiredCode(event.target.value.toUpperCase())}
            placeholder={suggestedCode}
            className="mt-2 font-mono uppercase tracking-wider"
          />
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Preview: <span className="font-mono font-semibold text-slate-200">{normalizedPreview}</span>
          </p>

          <div className="mt-4">
            <p className="data-label mb-2">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setDesiredCode(suggestedCode)} className={chip}>
                {suggestedCode}
              </button>
              {clinicName ? (
                <button type="button" onClick={() => setDesiredCode(clinicName)} className={chip}>
                  {normalizeInviteCode(clinicName)}
                </button>
              ) : null}
              {specialty ? (
                <button type="button" onClick={() => setDesiredCode(`${displayName}-${specialty}`)} className={chip}>
                  {normalizeInviteCode(`${displayName}-${specialty}`)}
                </button>
              ) : null}
            </div>
          </div>

          {error ? <Notice tone="error" className="mt-4">{error}</Notice> : null}
          {success ? <Notice tone="success" className="mt-4">{success}</Notice> : null}

          <div className="mt-5 flex gap-2">
            <Button onClick={() => saveCode(desiredCode)} disabled={loading || normalizeInviteCode(desiredCode) === currentCode}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Saving…" : "Save code"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDesiredCode(currentCode)
                setError("")
                setSuccess("")
              }}
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
