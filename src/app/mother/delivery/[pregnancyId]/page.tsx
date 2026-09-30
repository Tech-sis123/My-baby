"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Baby, LoaderCircle, PartyPopper } from "lucide-react"
import { SubHeader } from "@/components/app/sub-header"
import { OptionTile } from "@/components/app/option-tile"
import { Notice } from "@/components/app/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type Gender = "girl" | "boy" | ""

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
    <div className="min-h-screen">
      <SubHeader backHref="/mother/home" width="narrow" eyebrow="Delivery update" title="Move to baby care" />

      <main className="motion-rise mx-auto max-w-xl px-4 py-8 sm:px-6">
        <div className="surface relative overflow-hidden p-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--primary)] opacity-10 blur-2xl" />
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
            <PartyPopper className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-white">Congratulations!</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
            This closes your pregnancy track and starts your baby&apos;s care profile. Your linked doctor carries over automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <section className="surface space-y-4 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Baby className="h-4 w-4 text-[var(--primary)]" /> Baby details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="babyName">Baby&apos;s name</Label>
                <Input id="babyName" placeholder="Zara" value={babyName} onChange={event => setBabyName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth date</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={event => setBirthDate(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sex <span className="font-normal text-slate-500">(optional)</span></Label>
              <div role="radiogroup" aria-label="Sex" className="grid grid-cols-3 gap-2">
                <OptionTile size="sm" active={gender === "girl"} onClick={() => setGender("girl")} label="Girl" />
                <OptionTile size="sm" active={gender === "boy"} onClick={() => setGender("boy")} label="Boy" />
                <OptionTile size="sm" active={gender === ""} onClick={() => setGender("")} label="Skip" />
              </div>
            </div>
          </section>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Creating profile…" : "Start baby care"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
