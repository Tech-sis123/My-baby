"use client"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

type Gender = "girl" | "boy" | ""

export default function DeliveryPage() {
  const router = useRouter()
  const { pregnancyId } = useParams<{ pregnancyId: string }>()

  const [babyName, setBabyName] = useState("")
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split("T")[0])
  const [gender, setGender] = useState<Gender>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!babyName || !birthDate) return
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    // Get pregnancy to copy linked_doctor_id
    const { data: preg } = await supabase
      .from("pregnancies")
      .select("linked_doctor_id")
      .eq("id", pregnancyId)
      .single()

    // Mark pregnancy delivered
    const { error: pregError } = await supabase
      .from("pregnancies")
      .update({ status: "delivered", ended_at: new Date().toISOString() })
      .eq("id", pregnancyId)

    if (pregError) { setError(pregError.message); setLoading(false); return }

    // Create child record
    const { error: childError } = await supabase.from("children").insert({
      mother_id: user.id,
      name: babyName,
      birth_date: birthDate,
      gender: gender || null,
      linked_doctor_id: preg?.linked_doctor_id || null,
    })

    if (childError) { setError(childError.message); setLoading(false); return }

    router.push("/mother/home?delivered=1")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex flex-col">
      <header className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl animate-bounce">🎉</div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Congratulations!</h1>
            <p className="text-[var(--muted-foreground)] mt-2">
              What amazing news! Tell us about your baby so we can start tracking their health.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="babyName">Baby&apos;s name</Label>
              <Input
                id="babyName"
                placeholder="e.g. Zara"
                value={babyName}
                onChange={e => setBabyName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth date</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Gender <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></Label>
              <div className="flex gap-2">
                {[
                  { val: "girl" as Gender, label: "Girl 👧" },
                  { val: "boy" as Gender, label: "Boy 👦" },
                  { val: "" as Gender, label: "Prefer not to say" },
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setGender(opt.val)}
                    className={cn(
                      "flex-1 py-2 px-2 rounded-xl border-2 text-sm font-medium transition-all",
                      gender === opt.val
                        ? "border-[var(--primary)] bg-purple-50 text-[var(--primary)]"
                        : "border-[var(--border)] bg-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}

            <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600" size="lg" disabled={loading}>
              {loading ? "Saving…" : "Meet my baby! 🎀"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
