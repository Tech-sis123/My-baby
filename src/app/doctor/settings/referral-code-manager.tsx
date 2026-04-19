"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { buildDefaultInviteCode, normalizeInviteCode } from "@/lib/account"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    setSuccess("Referral code saved.")
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[1.8rem] border border-[var(--border)] bg-[rgba(8,17,31,0.76)] p-6 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-[#9ae6de]">Current code</p>
        <div className="mt-4 rounded-[1.5rem] border border-[rgba(125,211,252,0.18)] bg-[var(--surface-muted)] p-5 text-center">
          <span className="text-4xl font-semibold tracking-[0.24em] text-white">{desiredCode}</span>
        </div>
        <div className="mt-4">
          <CopyCodeButton code={desiredCode} />
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-[var(--border)] bg-[rgba(8,17,31,0.76)] p-6 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-[#7dd3fc]">Generate your special referral code</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Pick the name you want mothers to use</h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Example: use your name or clinic name. We convert it into a clean referral code automatically.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="desiredCode" className="mb-2 block text-sm font-medium text-white">Referral code name</label>
            <Input
              id="desiredCode"
              value={desiredCode}
              onChange={e => setDesiredCode(e.target.value.toUpperCase())}
              placeholder={buildDefaultInviteCode(displayName, userId)}
              className="bg-[rgba(8,17,31,0.45)] uppercase tracking-[0.2em] text-white"
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {success && <p className="text-sm text-emerald-300">{success}</p>}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => saveCode(desiredCode)} disabled={loading} className="flex-1">
            {loading ? "Saving…" : "Generate referral code"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setDesiredCode(buildDefaultInviteCode(displayName, userId))}
            className="flex-1 bg-transparent text-white"
          >
            Use suggested code
          </Button>
        </div>
      </section>
    </div>
  )
}
