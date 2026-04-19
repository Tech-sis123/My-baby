"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Baby, CalendarDays, HeartPulse, ShieldCheck, Sparkles } from "lucide-react"
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
        "rounded-[1.1rem] border px-4 py-3 text-sm font-medium transition",
        active
          ? "border-[rgba(201,139,88,0.34)] bg-[rgba(201,139,88,0.12)] text-white"
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
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Delivery handoff</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Move from pregnancy care to baby care</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 xl:grid-cols-[1.16fr_0.84fr]">
        <section className="space-y-6">
          <section className="panel-float overflow-hidden rounded-[2.2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                  <Sparkles className="h-3.5 w-3.5" /> Delivery update
                </div>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Congratulations. Let’s start your baby’s care track properly.
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  This closes the pregnancy journey and creates the new baby profile that powers baby check-ins, appointments, tips, and doctor linkage going forward.
                </p>
              </div>

              <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
                <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    <ShieldCheck className="h-4 w-4" /> What happens next
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 text-sm leading-6 text-white">
                      Your pregnancy record is marked as delivered.
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 text-sm leading-6 text-white">
                      A new baby profile is created for check-ins and appointments.
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4 text-sm leading-6 text-white">
                      Any linked doctor connection is carried over to the baby profile automatically.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">Baby details</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Add the first baby profile</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  This profile becomes the new center of the next care journey.
                </p>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                One quick setup
              </div>
            </div>

            <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_1fr]">
              <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <Baby className="h-4 w-4" /> Identity
                </div>
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
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
                </div>
              </section>

              <section className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <HeartPulse className="h-4 w-4" /> Optional detail
                </div>
                <div className="mt-5">
                  <Label className="text-[13px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Gender</Label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <OptionButton active={gender === "girl"} onClick={() => setGender("girl")} label="Girl" />
                    <OptionButton active={gender === "boy"} onClick={() => setGender("boy")} label="Boy" />
                    <OptionButton active={gender === ""} onClick={() => setGender("")} label="Prefer not to say" />
                  </div>
                </div>

                <div className="mt-5 rounded-[1.2rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    <CalendarDays className="h-4 w-4" /> After this step
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white">
                    Your home dashboard will start showing baby care actions, baby check-ins, and baby-linked appointments.
                  </p>
                </div>
              </section>
            </div>

            {error ? (
              <div className="mt-6 rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" disabled={loading} className="sm:flex-1">
                {loading ? "Creating baby profile" : "Start baby care journey"}
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
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <ShieldCheck className="h-4 w-4" /> Good to know
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                This does not delete your pregnancy record. It simply marks that journey as delivered.
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-white">
                If your doctor was already linked during pregnancy, the baby profile keeps that same connection.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
