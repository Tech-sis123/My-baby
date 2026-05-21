"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Baby, HeartPulse, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type Gender = "girl" | "boy" | ""

function OptionButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-2.5 text-sm font-medium transition",
        active
          ? "border-[rgba(201,139,88,0.5)] bg-[rgba(201,139,88,0.14)] text-white"
          : "border-[var(--border)] bg-[rgba(255,248,239,0.05)] text-[var(--muted-foreground)] hover:text-white"
      )}
    >
      {label}
    </button>
  )
}

export default function DeliveryPage() {
  const router = useRouter()
  const { pregnancyId } = useParams<{ pregnancyId: string }>()

  const [babyName, setBabyName] = useState("")
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split("T")[0])
  const [gender, setGender] = useState<Gender>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!babyName.trim() || !birthDate) {
      setError("Add your baby's name and birth date to continue.")
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

    const { data: pregnancy } = await supabase
      .from("pregnancies")
      .select("linked_doctor_id")
      .eq("id", pregnancyId)
      .single()

    const { error: pregnancyError } = await supabase
      .from("pregnancies")
      .update({ status: "delivered", ended_at: new Date().toISOString() })
      .eq("id", pregnancyId)

    if (pregnancyError) {
      setError(pregnancyError.message)
      setLoading(false)
      return
    }

    const { error: childError } = await supabase.from("children").insert({
      mother_id: user.id,
      name: babyName.trim(),
      birth_date: birthDate,
      gender: gender || null,
      linked_doctor_id: pregnancy?.linked_doctor_id || null,
    })

    if (childError) {
      setError(childError.message)
      setLoading(false)
      return
    }

    router.push("/mother/home?delivered=1")
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.88)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">Delivery handoff</p>
            <h1 className="text-base font-semibold text-white">Move to baby care</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Congratulations banner */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(201,139,88,0.3)] bg-[linear-gradient(135deg,rgba(201,139,88,0.16),rgba(255,248,239,0.06))] p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--primary)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Delivery update</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
            Congratulations. Let's start your baby's care track.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            This closes the pregnancy journey and creates the new baby profile. Any linked doctor connection carries over automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Baby name */}
          <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <Baby className="h-3.5 w-3.5" /> Baby details
            </div>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="babyName" className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Baby&apos;s name
                </Label>
                <Input
                  id="babyName"
                  placeholder="Zara"
                  value={babyName}
                  onChange={event => setBabyName(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
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
            </div>
          </div>

          {/* Gender */}
          <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <HeartPulse className="h-3.5 w-3.5" /> Gender (optional)
            </div>
            <div className="mt-3 flex gap-2">
              <OptionButton active={gender === "girl"} onClick={() => setGender("girl")} label="Girl" />
              <OptionButton active={gender === "boy"} onClick={() => setGender("boy")} label="Boy" />
              <OptionButton active={gender === ""} onClick={() => setGender("")} label="Prefer not to say" />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button type="submit" disabled={loading} className="sm:flex-1">
              {loading ? "Creating baby profile…" : "Start baby care journey"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-[var(--border)] bg-transparent text-white sm:flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
