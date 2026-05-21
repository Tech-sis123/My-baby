"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOutAndRedirect } from "@/lib/auth-client"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MedicalFooter } from "@/components/medical-footer"
import { formatStage, getGestationalWeek, getBabyAgeDays, SEVERITY_DOT } from "@/lib/utils"
import { getPregnancyTip, getBabyTip } from "@/lib/tips"
import type { Pregnancy, Child, Appointment, Flag } from "@/lib/supabase/types"
import {
  BellRing,
  Calendar,
  ChevronRight,
  Link2,
  LogOut,
  MessageCircle,
  Plus,
} from "lucide-react"

const MOTHER_IMAGE =
  "https://images.pexels.com/photos/35136012/pexels-photo-35136012.jpeg?auto=compress&cs=tinysrgb&w=800"

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

function LinkDoctorInline({
  subjectType,
  subjectId,
}: {
  subjectType: "pregnancy" | "child"
  subjectId: string
}) {
  const [code, setCode] = useState("")
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function linkDoctor() {
    if (!code.trim()) { setError("Enter the referral code first."); return }
    if (code.trim().length < 4) { setError("Code looks too short."); return }
    setLoading(true)
    setError("")
    setSuccess("")
    const supabase = createClient()
    const { data: doctor } = await supabase
      .from("doctors")
      .select("user_id")
      .eq("invite_code", code.trim().toUpperCase())
      .maybeSingle()

    if (!doctor) { setError("Referral code not found."); setLoading(false); return }

    const table = subjectType === "pregnancy" ? "pregnancies" : "children"
    const { error: updateError } = await supabase
      .from(table)
      .update({ linked_doctor_id: doctor.user_id })
      .eq("id", subjectId)

    if (updateError) { setError(updateError.message); setLoading(false); return }

    setSuccess("Doctor linked.")
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(199,143,98,0.26)] bg-[rgba(199,143,98,0.1)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition hover:border-[rgba(199,143,98,0.5)]"
      >
        <Link2 className="h-3 w-3" /> Link to doctor
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(73,60,51,0.9)] p-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter referral code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="flex-1 bg-[rgba(255,255,255,0.04)] uppercase tracking-[0.18em] text-white text-sm"
          autoFocus
        />
        <Button size="sm" onClick={linkDoctor} disabled={loading}>
          {loading ? "…" : "Link"}
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">Doctor sees your check-ins in real time.</p>
        <button onClick={() => setOpen(false)} className="text-xs text-[var(--muted-foreground)] hover:text-white">
          Cancel
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
      {success && <p className="mt-1.5 text-xs text-emerald-300">{success}</p>}
    </div>
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

  const flagsBySubject = flags.reduce(
    (acc, flag) => {
      if (!acc[flag.subject_id]) acc[flag.subject_id] = []
      acc[flag.subject_id].push(flag)
      return acc
    },
    {} as Record<string, Flag[]>
  )

  const topFlag = (id: string) => {
    const f = flagsBySubject[id] || []
    if (f.find(x => x.severity === "red")) return "red"
    if (f.find(x => x.severity === "yellow")) return "yellow"
    return null
  }

  const topFlagMessage = (id: string) => {
    const f = flagsBySubject[id] || []
    return (
      f.find(x => x.severity === "red")?.message ||
      f.find(x => x.severity === "yellow")?.message ||
      null
    )
  }

  const redFlags = flags.filter(f => f.severity === "red").length
  const yellowFlags = flags.filter(f => f.severity === "yellow").length
  const totalProfiles = pregnancies.length + babyProfiles.length
  const linkedSubjects = [...pregnancies, ...babyProfiles].filter(s => s.linked_doctor_id).length
  const hasPregnancy = pregnancies.length > 0
  const hasBaby = babyProfiles.length > 0

  const modeLabel =
    hasPregnancy && hasBaby
      ? "Dual care"
      : hasPregnancy
        ? "Pregnancy"
        : hasBaby
          ? "Baby care"
          : "Setup"

  const overview =
    hasPregnancy && hasBaby
      ? "Tracking both your pregnancy and your baby."
      : hasPregnancy
        ? "Focused on your pregnancy."
        : hasBaby
          ? "Focused on your baby's care."
          : "Add your first profile to unlock check-ins, tips, and doctor linking."

  async function handleSignOut() {
    await signOutAndRedirect(supabase, "/login?role=mother")
  }

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.92)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(199,143,98,0.35)] bg-[rgba(199,143,98,0.12)] text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
              MB
            </div>
            <div>
              <p className="text-base font-semibold text-white leading-none">My Baby</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                {modeLabel} mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/mother/ask" prefetch={false}>
              <Button variant="ghost" size="icon" aria-label="Health assistant">
                <MessageCircle className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Greeting banner — image on right, text on left */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)]">
          <div className="grid lg:grid-cols-[1fr_260px]">
            {/* Text side */}
            <div className="p-6 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--primary)]">
                {modeLabel} mode
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{profileName}</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{overview}</p>
              {email && (
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                  {email}
                </p>
              )}

              {/* Inline stats */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div>
                  <p className="text-2xl font-semibold text-white">{totalProfiles}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Profiles
                  </p>
                </div>
                <div className="w-px bg-[var(--border)]" />
                <div>
                  <p className={`text-2xl font-semibold ${redFlags + yellowFlags > 0 ? "text-red-200" : "text-white"}`}>
                    {redFlags + yellowFlags}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Alerts
                  </p>
                </div>
                <div className="w-px bg-[var(--border)]" />
                <div>
                  <p className="text-2xl font-semibold text-white">{linkedSubjects}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Linked to doctor
                  </p>
                </div>
              </div>
            </div>

            {/* Image side — decorative, hidden on mobile */}
            <div className="relative hidden overflow-hidden border-l border-[var(--border)] lg:block">
              <div
                className="absolute inset-0 bg-cover"
                style={{
                  backgroundImage: `url(${MOTHER_IMAGE})`,
                  backgroundPosition: "center 18%",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(73,60,51,0.7)] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(43,37,31,0.6)] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
                  Daily care
                </p>
                <p className="mt-1 text-sm font-semibold text-white leading-snug">
                  60 seconds to keep your doctor informed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_288px]">
          {/* ── Main content ── */}
          <div className="space-y-6">

            {/* Empty state */}
            {totalProfiles === 0 && (
              <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[rgba(73,60,51,0.4)] p-10 text-center">
                <p className="text-sm text-[var(--muted-foreground)] mb-5">
                  Add your first care profile to unlock check-ins, tips, and doctor linking.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/mother/onboarding?add=pregnancy" prefetch={false}>
                    <Button
                      variant="outline"
                      className="w-full border-[var(--border)] bg-transparent text-white sm:w-auto"
                    >
                      Add pregnancy <Plus className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/mother/onboarding?add=baby" prefetch={false}>
                    <Button
                      variant="outline"
                      className="w-full border-[var(--border)] bg-transparent text-white sm:w-auto"
                    >
                      Add baby <Plus className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </section>
            )}

            {/* Pregnancy section */}
            {pregnancies.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
                  Pregnancy
                </p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {pregnancies.map(pregnancy => {
                    const week = getGestationalWeek(pregnancy.due_date)
                    const stage = formatStage("pregnancy", { due_date: pregnancy.due_date })
                    const tip = getPregnancyTip(week)
                    const last = lastCheckins[pregnancy.id]
                    const flag = topFlag(pregnancy.id)
                    const flagMsg = topFlagMessage(pregnancy.id)

                    return (
                      <div
                        key={pregnancy.id}
                        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(78,64,54,0.74)]"
                      >
                        <div className="h-[3px] bg-gradient-to-r from-[rgba(199,143,98,0.9)] via-[rgba(242,177,121,0.8)] to-[rgba(249,214,158,0.7)]" />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xl font-semibold text-white">{stage}</span>
                                {flag && (
                                  <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[flag]}`} />
                                )}
                                {pregnancy.linked_doctor_id && (
                                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                                    Doctor linked
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                {last ? `Last check-in ${timeAgo(last)}` : "No check-ins yet"}
                              </p>
                            </div>
                            <Link
                              href={`/mother/checkin/pregnancy/${pregnancy.id}`}
                              prefetch={false}
                            >
                              <Button size="sm">Check in</Button>
                            </Link>
                          </div>

                          {flagMsg && (
                            <div
                              className={`mt-3 rounded-xl border px-3 py-2.5 text-sm ${
                                flag === "red"
                                  ? "border-red-400/25 bg-red-500/10 text-red-100"
                                  : "border-yellow-400/25 bg-yellow-500/10 text-yellow-100"
                              }`}
                            >
                              {flagMsg}
                            </div>
                          )}

                          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                            {tip}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <Link
                              href={`/mother/delivery/${pregnancy.id}`}
                              prefetch={false}
                              className="text-[var(--foreground)] hover:text-white"
                            >
                              I had my baby
                            </Link>
                            <span className="text-[var(--border)]">·</span>
                            <Link
                              href={`/mother/brief/pregnancy/${pregnancy.id}`}
                              prefetch={false}
                              className="text-[var(--muted-foreground)] hover:text-white"
                            >
                              Pre-visit brief
                            </Link>
                            <span className="text-[var(--border)]">·</span>
                            <button
                              onClick={async () => {
                                if (!confirm("Mark this pregnancy as ended?")) return
                                await supabase
                                  .from("pregnancies")
                                  .update({
                                    status: "ended",
                                    ended_at: new Date().toISOString(),
                                  })
                                  .eq("id", pregnancy.id)
                                router.refresh()
                              }}
                              className="text-[var(--muted-foreground)] hover:text-white"
                            >
                              Update (loss)
                            </button>
                          </div>

                          {!pregnancy.linked_doctor_id && (
                            <div className="mt-3">
                              <LinkDoctorInline
                                subjectType="pregnancy"
                                subjectId={pregnancy.id}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!hasBaby && (
                  <Link
                    href="/mother/onboarding?add=baby"
                    prefetch={false}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add baby profile
                  </Link>
                )}
              </div>
            )}

            {/* Baby section */}
            {babyProfiles.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
                  Baby care
                </p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {babyProfiles.map(child => {
                    const ageDays = getBabyAgeDays(child.birth_date)
                    const stage = formatStage("child", {
                      birth_date: child.birth_date,
                      name: child.name,
                    })
                    const tip = getBabyTip(ageDays)
                    const last = lastCheckins[child.id]
                    const flag = topFlag(child.id)
                    const flagMsg = topFlagMessage(child.id)

                    return (
                      <div
                        key={child.id}
                        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(78,64,54,0.74)]"
                      >
                        <div className="h-[3px] bg-gradient-to-r from-[rgba(240,178,161,0.88)] via-[rgba(199,143,98,0.9)] to-[rgba(248,225,178,0.8)]" />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xl font-semibold text-white">{stage}</span>
                                {flag && (
                                  <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[flag]}`} />
                                )}
                                {child.linked_doctor_id && (
                                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                                    Doctor linked
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                {last ? `Last check-in ${timeAgo(last)}` : "No check-ins yet"}
                              </p>
                            </div>
                            <Link href={`/mother/checkin/child/${child.id}`} prefetch={false}>
                              <Button size="sm">Check in</Button>
                            </Link>
                          </div>

                          {flagMsg && (
                            <div
                              className={`mt-3 rounded-xl border px-3 py-2.5 text-sm ${
                                flag === "red"
                                  ? "border-red-400/25 bg-red-500/10 text-red-100"
                                  : "border-yellow-400/25 bg-yellow-500/10 text-yellow-100"
                              }`}
                            >
                              {flagMsg}
                            </div>
                          )}

                          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                            {tip}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <Link
                              href={`/mother/brief/child/${child.id}`}
                              prefetch={false}
                              className="text-[var(--muted-foreground)] hover:text-white"
                            >
                              Pre-visit brief
                            </Link>
                          </div>

                          {!child.linked_doctor_id && (
                            <div className="mt-3">
                              <LinkDoctorInline subjectType="child" subjectId={child.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!hasPregnancy && (
                  <Link
                    href="/mother/onboarding?add=pregnancy"
                    prefetch={false}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add pregnancy profile
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">
            {/* Alerts */}
            {(redFlags > 0 || yellowFlags > 0) && (
              <section className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <BellRing className="h-3.5 w-3.5" /> Alerts
                </p>
                <div className="space-y-2">
                  {redFlags > 0 && (
                    <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-red-200">
                        Immediate
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">{redFlags}</p>
                    </div>
                  )}
                  {yellowFlags > 0 && (
                    <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-100">
                        Review soon
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">{yellowFlags}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Upcoming appointments */}
            <section className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <Calendar className="h-3.5 w-3.5" /> Appointments
                </p>
                <Link
                  href="/mother/appointments"
                  prefetch={false}
                  className="text-xs text-[var(--muted-foreground)] hover:text-white"
                >
                  View all
                </Link>
              </div>
              {appointments.length === 0 ? (
                <Link
                  href="/mother/appointments"
                  prefetch={false}
                  className="block rounded-xl border border-dashed border-[var(--border)] p-3 text-sm text-[var(--muted-foreground)] hover:border-[rgba(199,143,98,0.4)] hover:text-white"
                >
                  No upcoming appointments. Add one →
                </Link>
              ) : (
                <div className="space-y-2">
                  {appointments.map(apt => (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5"
                    >
                      <p className="text-sm font-semibold text-white">{apt.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {new Date(apt.scheduled_at).toLocaleDateString("en-NG", {
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

            {/* Quick actions */}
            <section className="space-y-2 rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
              <Link
                href="/mother/ask"
                prefetch={false}
                className="block rounded-xl border border-[rgba(199,143,98,0.22)] bg-[rgba(199,143,98,0.08)] px-4 py-3 transition hover:border-[rgba(199,143,98,0.4)]"
              >
                <p className="text-sm font-semibold text-white">Ask AI assistant</p>
                <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">
                  Quick answers about pregnancy or baby care.
                </p>
              </Link>
              <Link
                href="/mother/appointments"
                prefetch={false}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white transition hover:border-[rgba(199,143,98,0.3)]"
              >
                Manage appointments
                <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
              </Link>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/mother/onboarding?add=pregnancy" prefetch={false}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-[var(--border)] bg-transparent text-white"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Pregnancy
                  </Button>
                </Link>
                <Link href="/mother/onboarding?add=baby" prefetch={false}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-[var(--border)] bg-transparent text-white"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Baby
                  </Button>
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <MedicalFooter />
    </div>
  )
}
