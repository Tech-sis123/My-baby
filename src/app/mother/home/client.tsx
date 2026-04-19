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
import {
  BellRing,
  Calendar,
  ChevronRight,
  HeartPulse,
  Link2,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const MOTHER_DASHBOARD_IMAGE =
  "https://images.pexels.com/photos/35136012/pexels-photo-35136012.jpeg?auto=compress&cs=tinysrgb&w=1200"

interface Props {
  profileName: string
  email: string
  pregnancies: Pregnancy[]
  babyProfiles: Child[]
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

  async function linkDoctor() {
    if (!code.trim()) return
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { data: doctor } = await supabase
      .from("doctors")
      .select("user_id")
      .eq("invite_code", code.trim().toUpperCase())
      .maybeSingle()

    if (!doctor) {
      setError("Referral code not found.")
      setLoading(false)
      return
    }

    const table = subjectType === "pregnancy" ? "pregnancies" : "children"
    const { error: updateError } = await supabase
      .from(table)
      .update({ linked_doctor_id: doctor.user_id })
      .eq("id", subjectId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(199,143,98,0.26)] bg-[rgba(199,143,98,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground)] transition hover:border-[rgba(199,143,98,0.5)] hover:bg-[rgba(199,143,98,0.18)]"
      >
        <Link2 className="h-3.5 w-3.5" /> Link to doctor
      </button>
    )
  }

  return (
    <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(73,60,51,0.78)] p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Enter doctor referral code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="flex-1 bg-[rgba(255,255,255,0.03)] uppercase tracking-[0.2em] text-white"
          autoFocus
        />
        <Button size="sm" onClick={linkDoctor} disabled={loading}>
          {loading ? "Linking..." : "Link"}
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted-foreground)]">
          Once linked, your doctor sees new check-ins on their dashboard.
        </p>
        <button onClick={() => setOpen(false)} className="text-xs text-[var(--muted-foreground)] hover:text-white">
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string
  subtitle: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5 shadow-[0_22px_54px_rgba(0,0,0,0.16)]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${accent}`}>{subtitle}</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

export function MotherHomeClient({
  profileName,
  email,
  pregnancies,
  babyProfiles,
  appointments,
  flags,
  lastCheckins,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const flagsBySubject = flags.reduce((acc, flag) => {
    if (!acc[flag.subject_id]) acc[flag.subject_id] = []
    acc[flag.subject_id].push(flag)
    return acc
  }, {} as Record<string, Flag[]>)

  const topFlag = (id: string) => {
    const subjectFlags = flagsBySubject[id] || []
    if (subjectFlags.find(flag => flag.severity === "red")) return "red"
    if (subjectFlags.find(flag => flag.severity === "yellow")) return "yellow"
    return null
  }

  const topFlagMessage = (id: string) => {
    const subjectFlags = flagsBySubject[id] || []
    return (
      subjectFlags.find(flag => flag.severity === "red")?.message ||
      subjectFlags.find(flag => flag.severity === "yellow")?.message ||
      null
    )
  }

  const redFlags = flags.filter(flag => flag.severity === "red").length
  const yellowFlags = flags.filter(flag => flag.severity === "yellow").length
  const linkedSubjects = [...pregnancies, ...babyProfiles].filter(subject => subject.linked_doctor_id).length
  const hasPregnancy = pregnancies.length > 0
  const hasBaby = babyProfiles.length > 0
  const mode = hasPregnancy && hasBaby ? "Dual care mode" : hasPregnancy ? "Pregnancy mode" : hasBaby ? "Baby care mode" : "Start your care journey"
  const overview = hasPregnancy && hasBaby
    ? "Your dashboard is tracking both your pregnancy and your baby."
    : hasPregnancy
      ? "Everything here is focused on your pregnancy right now."
      : hasBaby
        ? "Everything here is focused on your baby's care right now."
        : "Add your first pregnancy or baby to unlock check-ins, quick tips, and doctor linking."

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(199,143,98,0.35)] bg-[rgba(199,143,98,0.12)] text-sm font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
              MB
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-white">My Baby Care Desk</p>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">{mode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/mother/ask">
              <Button variant="ghost" size="icon" aria-label="Health assistant">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[rgba(19,20,23,0.92)] shadow-[0_34px_90px_rgba(0,0,0,0.26)]">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                  <Sparkles className="h-3.5 w-3.5" /> Personal care dashboard
                </div>
                <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                  {profileName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{overview}</p>
                {email && (
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{email}</p>
                )}

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Care profiles</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{pregnancies.length + babyProfiles.length}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-red-400/20 bg-red-500/8 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-red-200">Needs attention</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{redFlags + yellowFlags}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground)]">Linked to doctor</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{linkedSubjects}</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[280px] border-t border-[var(--border)] lg:min-h-full lg:border-l lg:border-t-0">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${MOTHER_DASHBOARD_IMAGE})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(50,40,33,0.9)] via-[rgba(50,40,33,0.32)] to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-6">
                  <div className="max-w-xs rounded-[1.4rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(12,13,16,0.62)] p-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-[rgba(243,238,230,0.72)]">Focused context</p>
                    <p className="mt-2 text-sm leading-6 text-white">
                      Suggestions, check-ins, and reminders are supposed to follow your current care mode instead of mixing pregnancy and baby advice together.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {pregnancies.length === 0 && babyProfiles.length === 0 && (
            <SectionCard title="Build your dashboard" subtitle="First step" accent="text-[var(--primary)]">
              <p className="mb-5 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
                Choose the experience that matches you now. If you have a baby, the dashboard should focus on baby care. If you are pregnant, it should focus on pregnancy only.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/mother/onboarding?add=pregnancy">
                  <Button variant="outline" className="w-full justify-between border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-white">
                    Add pregnancy <Plus className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/mother/onboarding?add=baby">
                  <Button variant="outline" className="w-full justify-between border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-white">
                    Add baby <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </SectionCard>
          )}

          {pregnancies.length > 0 && (
            <SectionCard title="Pregnancy focus" subtitle="Mother health" accent="text-[var(--primary)]">
              <div className="grid gap-4 xl:grid-cols-2">
                {pregnancies.map((pregnancy, index) => {
                  const week = getGestationalWeek(pregnancy.due_date)
                  const stage = formatStage("pregnancy", { due_date: pregnancy.due_date })
                  const tip = getPregnancyTip(week)
                  const last = lastCheckins[pregnancy.id]
                  const flag = topFlag(pregnancy.id)
                  const flagMsg = topFlagMessage(pregnancy.id)

                  return (
                    <Card key={pregnancy.id} className="overflow-hidden border-[var(--border)] bg-[rgba(78,64,54,0.74)]">
                      <div className="h-1 bg-gradient-to-r from-[rgba(199,143,98,0.92)] via-[rgba(242,177,121,0.82)] to-[rgba(249,214,158,0.76)]" />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                                Case {index + 1}
                              </span>
                              <span className="text-xl font-semibold text-white">{stage}</span>
                              {flag && <span className={`h-2.5 w-2.5 rounded-full ${SEVERITY_DOT[flag]}`} />}
                            </div>
                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                              {last ? `Last check-in ${timeAgo(last)}` : "No check-ins yet"}
                            </p>
                          </div>
                          <Link href={`/mother/checkin/pregnancy/${pregnancy.id}`}>
                            <Button size="sm">Check in</Button>
                          </Link>
                        </div>

                        {flagMsg && (
                          <div
                            className={`mt-4 rounded-[1.3rem] border px-4 py-3 text-sm ${
                              flag === "red"
                                ? "border-red-400/25 bg-red-500/10 text-red-100"
                                : "border-yellow-400/25 bg-yellow-500/10 text-yellow-100"
                            }`}
                          >
                            {flagMsg}
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-[1.3rem] border border-[rgba(199,143,98,0.2)] bg-[rgba(199,143,98,0.08)] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]">Quick health tip</p>
                            <p className="mt-2 text-sm leading-6 text-white">{tip}</p>
                          </div>
                          <div className="rounded-[1.3rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Suggested next step</p>
                            <p className="mt-2 text-sm leading-6 text-white">
                              Keep pregnancy notes updated before your next visit so the AI brief stays relevant to this stage.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <Link href={`/mother/delivery/${pregnancy.id}`} className="text-[var(--foreground)] hover:text-white">
                            I had my baby
                          </Link>
                          <Link href={`/mother/brief/pregnancy/${pregnancy.id}`} className="text-[var(--muted-foreground)] hover:text-white">
                            Pre-visit brief
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm("Mark this pregnancy as ended?")) return
                              await supabase
                                .from("pregnancies")
                                .update({ status: "ended", ended_at: new Date().toISOString() })
                                .eq("id", pregnancy.id)
                              router.refresh()
                            }}
                            className="text-[var(--muted-foreground)] hover:text-white"
                          >
                            Update (loss)
                          </button>
                        </div>

                        {!pregnancy.linked_doctor_id && (
                          <div className="mt-4">
                            <LinkDoctorInline subjectType="pregnancy" subjectId={pregnancy.id} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {babyProfiles.length > 0 && (
            <SectionCard title="Baby focus" subtitle="Child health" accent="text-[var(--primary)]">
              <div className="grid gap-4 xl:grid-cols-2">
                {babyProfiles.map((child, index) => {
                  const ageDays = getBabyAgeDays(child.birth_date)
                  const stage = formatStage("child", { birth_date: child.birth_date, name: child.name })
                  const tip = getBabyTip(ageDays)
                  const last = lastCheckins[child.id]
                  const flag = topFlag(child.id)
                  const flagMsg = topFlagMessage(child.id)

                  return (
                    <Card key={child.id} className="overflow-hidden border-[var(--border)] bg-[rgba(78,64,54,0.74)]">
                      <div className="h-1 bg-gradient-to-r from-[rgba(240,178,161,0.88)] via-[rgba(199,143,98,0.9)] to-[rgba(248,225,178,0.8)]" />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                                Child {index + 1}
                              </span>
                              <span className="text-xl font-semibold text-white">{stage}</span>
                              {flag && <span className={`h-2.5 w-2.5 rounded-full ${SEVERITY_DOT[flag]}`} />}
                            </div>
                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                              {last ? `Last check-in ${timeAgo(last)}` : "No check-ins yet"}
                            </p>
                          </div>
                          <Link href={`/mother/checkin/child/${child.id}`}>
                            <Button size="sm">Check in</Button>
                          </Link>
                        </div>

                        {flagMsg && (
                          <div
                            className={`mt-4 rounded-[1.3rem] border px-4 py-3 text-sm ${
                              flag === "red"
                                ? "border-red-400/25 bg-red-500/10 text-red-100"
                                : "border-yellow-400/25 bg-yellow-500/10 text-yellow-100"
                            }`}
                          >
                            {flagMsg}
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-[1.3rem] border border-[rgba(199,143,98,0.2)] bg-[rgba(199,143,98,0.08)] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]">Quick health tip</p>
                            <p className="mt-2 text-sm leading-6 text-white">{tip}</p>
                          </div>
                          <div className="rounded-[1.3rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Care context</p>
                            <p className="mt-2 text-sm leading-6 text-white">
                              Baby check-ins, tips, and AI prompts should stay scoped to this child instead of mixing with pregnancy content.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <Link href={`/mother/brief/child/${child.id}`} className="text-[var(--muted-foreground)] hover:text-white">
                            Pre-visit brief
                          </Link>
                        </div>

                        {!child.linked_doctor_id && (
                          <div className="mt-4">
                            <LinkDoctorInline subjectType="child" subjectId={child.id} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </div>

        <aside className="space-y-6">
          <section className="panel-float overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)]">
            <div
              className="h-56 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(to top, rgba(60,47,38,0.76), rgba(60,47,38,0.14)), url(${MOTHER_DASHBOARD_IMAGE})` }}
            />
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <HeartPulse className="h-4 w-4" /> Dashboard signals
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                This side of the dashboard stays dense on desktop so appointments, alerts, and support actions are visible without hiding everything in one panel.
              </p>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5">
            <div className="grid gap-3">
              <div className="rounded-[1.4rem] border border-red-400/25 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-200">Immediate attention</p>
                <p className="mt-2 text-3xl font-semibold text-white">{redFlags}</p>
              </div>
              <div className="rounded-[1.4rem] border border-yellow-400/25 bg-yellow-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-yellow-100">Review soon</p>
                <p className="mt-2 text-3xl font-semibold text-white">{yellowFlags}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--foreground)]">
                  <ShieldCheck className="h-4 w-4" /> Doctor connection
                </div>
                <p className="mt-2 text-3xl font-semibold text-white">{linkedSubjects}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">Profiles currently linked to a doctor referral code.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Calendar className="h-4 w-4" /> Upcoming appointments
              </div>
              <Link href="/mother/appointments" className="text-sm text-[var(--foreground)] hover:text-white">
                View all
              </Link>
            </div>

            {appointments.length === 0 ? (
              <Link
                href="/mother/appointments"
                className="mt-4 block rounded-[1.4rem] border border-dashed border-[var(--border)] p-4 text-sm leading-6 text-[var(--muted-foreground)] hover:border-[rgba(199,143,98,0.45)] hover:text-white"
              >
                No upcoming appointments yet. Add your next visit.
              </Link>
            ) : (
              <div className="mt-4 space-y-3">
                {appointments.map(appointment => (
                  <div key={appointment.id} className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="font-semibold text-white">{appointment.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {new Date(appointment.scheduled_at).toLocaleDateString("en-NG", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[1.8rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <BellRing className="h-4 w-4" /> Check-ins and support
            </div>
            <div className="mt-4 space-y-3">
              <Link href="/mother/ask" className="block rounded-[1.4rem] border border-[rgba(199,143,98,0.22)] bg-[rgba(199,143,98,0.08)] p-4">
                <p className="font-semibold text-white">Ask the AI assistant</p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                  Get quick answers based on your current pregnancy or baby-care context.
                </p>
              </Link>
              <Link href="/mother/appointments" className="flex items-center justify-between rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-white">
                Schedule or manage appointments <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
              </Link>
              <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Quick actions</p>
                <div className="mt-3 grid gap-2">
                  <Link href="/mother/onboarding?add=pregnancy">
                    <Button variant="outline" className="w-full justify-between border-[var(--border)] bg-transparent text-white">
                      Add pregnancy <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/mother/onboarding?add=baby">
                    <Button variant="outline" className="w-full justify-between border-[var(--border)] bg-transparent text-white">
                      Add baby <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <MedicalFooter />
    </div>
  )
}
