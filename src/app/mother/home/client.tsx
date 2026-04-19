"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { MedicalFooter } from "@/components/medical-footer"
import { formatStage, getGestationalWeek, getBabyAgeDays, SEVERITY_DOT } from "@/lib/utils"
import { getPregnancyTip, getBabyTip } from "@/lib/tips"
import type { Pregnancy, Child, Appointment, Flag } from "@/lib/supabase/types"
import { Baby, Plus, Heart, Calendar, MessageCircle, LogOut, ChevronRight } from "lucide-react"

interface Props {
  pregnancies: Pregnancy[]
  children: Child[]
  appointments: Appointment[]
  flags: Flag[]
  lastCheckins: Record<string, string>
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function LinkDoctorInline({ subjectType, subjectId }: { subjectType: "pregnancy" | "child"; subjectId: string }) {
  const [code, setCode] = useState("")
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function link() {
    if (!code.trim()) return
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { data: doctor } = await supabase
      .from("doctors").select("user_id")
      .eq("invite_code", code.trim().toUpperCase()).single()
    if (!doctor) { setError("Code not found"); setLoading(false); return }
    const table = subjectType === "pregnancy" ? "pregnancies" : "children"
    await supabase.from(table).update({ linked_doctor_id: doctor.user_id }).eq("id", subjectId)
    router.refresh()
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="text-xs text-[var(--primary)] font-medium flex items-center gap-1 hover:underline"
    >
      <Plus className="w-3 h-3" /> Link to a doctor
    </button>
  )

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Doctor invite code"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        className="h-9 text-sm uppercase tracking-widest flex-1"
        autoFocus
      />
      <Button size="sm" onClick={link} disabled={loading}>
        {loading ? "…" : "Link"}
      </Button>
      <button onClick={() => setOpen(false)} className="text-xs text-[var(--muted-foreground)]">Cancel</button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function MotherHomeClient({ pregnancies, children, appointments, flags, lastCheckins }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const flagsBySubject = flags.reduce((acc, f) => {
    if (!acc[f.subject_id]) acc[f.subject_id] = []
    acc[f.subject_id].push(f)
    return acc
  }, {} as Record<string, Flag[]>)

  const topFlag = (id: string) => {
    const fs = flagsBySubject[id] || []
    if (fs.find(f => f.severity === "red")) return "red"
    if (fs.find(f => f.severity === "yellow")) return "yellow"
    return null
  }

  const topFlagMessage = (id: string) => {
    const fs = flagsBySubject[id] || []
    return fs.find(f => f.severity === "red")?.message
      || fs.find(f => f.severity === "yellow")?.message
      || null
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-[var(--primary)]" />
          <span className="text-lg font-bold">My Baby</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/mother/ask">
            <Button variant="ghost" size="icon" aria-label="Health assistant">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Empty state */}
        {pregnancies.length === 0 && children.length === 0 && (
          <div className="text-center py-16">
            <Heart className="w-14 h-14 mx-auto mb-4 text-purple-200" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Welcome!</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-6">
              Add a pregnancy or baby to get started.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/mother/onboarding?add=pregnancy">
                <Button variant="outline">🤰 Add pregnancy</Button>
              </Link>
              <Link href="/mother/onboarding?add=baby">
                <Button variant="outline">🍼 Add baby</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Pregnancy cards */}
        {pregnancies.map(p => {
          const week = getGestationalWeek(p.due_date)
          const stage = formatStage("pregnancy", { due_date: p.due_date })
          const tip = getPregnancyTip(week)
          const last = lastCheckins[p.id]
          const flag = topFlag(p.id)
          const flagMsg = topFlagMessage(p.id)

          return (
            <Card key={p.id} className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-400 to-pink-400" />
              <CardContent className="p-5">

                {/* Top row: stage + check-in CTA */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🤰</span>
                      <span className="font-bold text-[var(--foreground)]">{stage}</span>
                      {flag && <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[flag]}`} />}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] ml-8 mt-0.5">
                      {last ? `Checked in ${timeAgo(last)}` : "No check-ins yet"}
                    </p>
                  </div>
                  <Link href={`/mother/checkin/pregnancy/${p.id}`}>
                    <Button size="sm">Check in</Button>
                  </Link>
                </div>

                {/* Flag alert (if any) */}
                {flagMsg && (
                  <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${
                    flag === "red" ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  }`}>
                    {flagMsg}
                  </div>
                )}

                {/* Tip */}
                <div className="bg-purple-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-purple-700 mb-1">This week</p>
                  <p className="text-sm text-purple-800">{tip}</p>
                </div>

                {/* Link doctor if not linked */}
                {!p.linked_doctor_id && (
                  <div className="mb-3">
                    <LinkDoctorInline subjectType="pregnancy" subjectId={p.id} />
                  </div>
                )}

                {/* Secondary actions — subtle, not competing with Check in */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-4">
                    <Link href={`/mother/delivery/${p.id}`} className="text-sm text-[var(--primary)] font-medium hover:underline">
                      I had my baby 🎉
                    </Link>
                    <Link href={`/mother/brief/pregnancy/${p.id}`} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      Pre-visit brief
                    </Link>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Mark this pregnancy as ended?")) return
                      await supabase.from("pregnancies").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", p.id)
                      router.refresh()
                    }}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    Update (loss)
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Child cards */}
        {children.map(c => {
          const ageDays = getBabyAgeDays(c.birth_date)
          const stage = formatStage("child", { birth_date: c.birth_date, name: c.name })
          const tip = getBabyTip(ageDays)
          const last = lastCheckins[c.id]
          const flag = topFlag(c.id)
          const flagMsg = topFlagMessage(c.id)

          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-pink-400 to-rose-400" />
              <CardContent className="p-5">

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍼</span>
                      <span className="font-bold text-[var(--foreground)]">{stage}</span>
                      {flag && <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[flag]}`} />}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] ml-8 mt-0.5">
                      {last ? `Checked in ${timeAgo(last)}` : "No check-ins yet"}
                    </p>
                  </div>
                  <Link href={`/mother/checkin/child/${c.id}`}>
                    <Button size="sm">Check in</Button>
                  </Link>
                </div>

                {flagMsg && (
                  <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${
                    flag === "red" ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  }`}>
                    {flagMsg}
                  </div>
                )}

                <div className="bg-pink-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-pink-700 mb-1">This month</p>
                  <p className="text-sm text-pink-800">{tip}</p>
                </div>

                {!c.linked_doctor_id && (
                  <div className="mb-3">
                    <LinkDoctorInline subjectType="child" subjectId={c.id} />
                  </div>
                )}

                <div className="flex items-center pt-3 border-t border-[var(--border)]">
                  <Link href={`/mother/brief/child/${c.id}`} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    Pre-visit brief
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Add more — only show when already have subjects */}
        {(pregnancies.length > 0 || children.length > 0) && (
          <div className="flex gap-3">
            <Link href="/mother/onboarding?add=pregnancy" className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-sm">
                <Plus className="w-3.5 h-3.5" /> Pregnancy
              </Button>
            </Link>
            <Link href="/mother/onboarding?add=baby" className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-sm">
                <Plus className="w-3.5 h-3.5" /> Baby
              </Button>
            </Link>
          </div>
        )}

        {/* Appointments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Upcoming</h2>
            <Link href="/mother/appointments" className="text-sm text-[var(--primary)] font-medium flex items-center gap-0.5 hover:underline">
              All appointments <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {appointments.length === 0 ? (
            <Link href="/mother/appointments">
              <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] transition-colors">
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="text-sm">No upcoming appointments — add one</span>
              </div>
            </Link>
          ) : (
            <div className="space-y-2">
              {appointments.map(apt => (
                <div key={apt.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[var(--border)]">
                  <Calendar className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{apt.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(apt.scheduled_at).toLocaleDateString("en-NG", {
                        weekday: "short", day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <MedicalFooter />
    </div>
  )
}
