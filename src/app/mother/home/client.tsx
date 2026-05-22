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
  Bot,
  Settings,
  MessageSquare,
  Plus,
  ArrowRight,
  Activity,
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
  latestStatus?: Record<string, { severity: string; message: string }>
  recentCheckins?: Array<{ id: string; subject_id: string; subject_type: string; created_at: string; severity?: string; message?: string }>
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
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition-all hover:bg-white/10 hover:text-white"
      >
        <Link2 className="h-3.5 w-3.5" /> Link to doctor
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
      <div className="flex gap-2">
        <Input
          placeholder="Enter referral code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="flex-1 border-white/10 bg-white/5 uppercase tracking-[0.18em] text-white text-sm focus-visible:ring-primary/30"
          autoFocus
        />
        <Button size="sm" onClick={linkDoctor} disabled={loading} className="rounded-xl bg-primary text-white hover:bg-primary/90">
          {loading ? "…" : "Link"}
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider">Doctor sees check-ins instantly</p>
        <button onClick={() => setOpen(false)} className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] hover:text-white transition-colors">
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400 font-medium">{error}</p>}
      {success && <p className="mt-2 text-xs text-emerald-400 font-medium">{success}</p>}
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
  latestStatus = {},
  recentCheckins = [],
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
      {/* Sleek Glass Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-inner">
              <img src={MOTHER_IMAGE} alt="Profile" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-base font-semibold text-white leading-none">My Baby</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--primary)]">
                {modeLabel} mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/mother/messages" prefetch={false}>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-all" aria-label="Messages">
                <MessageSquare className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Link href="/mother/ask" prefetch={false}>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-all" aria-label="Health assistant">
                <Bot className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Link href="/mother/settings" prefetch={false}>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-all" aria-label="Settings">
                <Settings className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <div className="mx-1 h-4 w-px bg-white/10" />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9 rounded-full text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all" aria-label="Sign out">
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Premium Greeting Banner */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-3xl mb-8 sm:mb-12">
          {/* Subtle gradient glow in background */}
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[var(--primary)]/20 blur-[120px] pointer-events-none" />
          
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] items-center relative z-10">
            {/* Text side */}
            <div className="p-8 sm:p-12 lg:pr-4">
              <div className="inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)] mb-6">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                </span>
                {modeLabel} mode active
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-4">
                Good to see you, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{profileName.split(' ')[0]}</span>.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg mb-8">
                {overview} We're keeping everything organized so you and your doctor are always on the same page.
              </p>
              
              {/* Sleek Inline Stats */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 backdrop-blur-md transition-colors hover:bg-black/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white leading-none">{totalProfiles}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Profiles</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 backdrop-blur-md transition-colors hover:bg-black/30">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${redFlags + yellowFlags > 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-emerald-400'}`}>
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold leading-none ${redFlags + yellowFlags > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {redFlags + yellowFlags}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Alerts</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 backdrop-blur-md transition-colors hover:bg-black/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-blue-400">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white leading-none">{linkedSubjects}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Linked</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image side - elegant fade */}
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2b251f] via-transparent to-transparent z-10 w-48" />
              <img 
                src={MOTHER_IMAGE} 
                alt="Motherhood"
                className="h-full w-full object-cover object-[center_18%] opacity-70 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
          
          {/* ── Main content (Profiles) ── */}
          <div className="space-y-10">

            {/* Empty state */}
            {totalProfiles === 0 && (
              <section className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl transition-all duration-300 hover:bg-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                    <Plus className="h-8 w-8 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-3">Begin Your Care Journey</h2>
                  <p className="text-base text-gray-400 mb-8 max-w-md mx-auto">
                    Add your first care profile to unlock personalized check-ins, medical insights, and doctor linking.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/mother/onboarding?add=pregnancy" prefetch={false}>
                      <Button size="lg" className="w-full sm:w-auto rounded-full bg-[var(--primary)] px-8 font-semibold shadow-lg shadow-[var(--primary)]/20 hover:scale-105 hover:bg-[var(--primary)] hover:shadow-[var(--primary)]/40 transition-all text-white">
                        Add Pregnancy
                      </Button>
                    </Link>
                    <Link href="/mother/onboarding?add=baby" prefetch={false}>
                      <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-white/20 bg-white/5 px-8 font-semibold backdrop-blur-md hover:bg-white/10 hover:text-white transition-all text-white">
                        Add Baby Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Pregnancy section */}
            {pregnancies.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--primary)]">Pregnancy Track</h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>
                
                <div className="grid gap-6">
                  {pregnancies.map(pregnancy => {
                    const week = getGestationalWeek(pregnancy.due_date)
                    const stage = formatStage("pregnancy", { due_date: pregnancy.due_date })
                    const tip = getPregnancyTip(week)
                    const lastCheckin = lastCheckins[pregnancy.id]
                    const flag = topFlag(pregnancy.id)
                    const flagMsg = topFlagMessage(pregnancy.id)

                    return (
                      <div key={pregnancy.id} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-1 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-2xl hover:shadow-[var(--primary)]/5 backdrop-blur-xl">
                        {/* Glow orb */}
                        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[var(--primary)]/10 blur-[80px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10 rounded-[2.3rem] bg-black/20 p-6 sm:p-8 backdrop-blur-md border border-white/5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stage}</h3>
                                {flag && (
                                  <span className={`flex h-3 w-3 rounded-full ${SEVERITY_DOT[flag]} shadow-[0_0_12px_currentColor]`} />
                                )}
                              </div>
                              <p className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                                <Calendar className="h-3.5 w-3.5" />
                                {lastCheckin ? `Last checked in ${timeAgo(lastCheckin)}` : "No check-ins yet"}
                                {pregnancy.linked_doctor_id && (
                                  <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Doctor Linked
                                  </span>
                                )}
                              </p>
                            </div>
                            
                            <Link href={`/mother/checkin?type=pregnancy&id=${pregnancy.id}`} className="group relative hidden sm:flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(199,143,98,0.3)] transition-all hover:bg-[var(--primary)]/90 hover:shadow-[0_0_25px_rgba(199,143,98,0.5)]">
                              Check In Now
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>

                          {latestStatus[pregnancy.id] && (
                            <div className={`mt-6 rounded-2xl border px-5 py-4 ${
                              latestStatus[pregnancy.id].severity === "red"
                                ? "border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                                : latestStatus[pregnancy.id].severity === "yellow"
                                ? "border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                                : "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            }`}>
                              <div className="flex items-start gap-3">
                                <BellRing className={`mt-0.5 h-5 w-5 shrink-0 ${
                                  latestStatus[pregnancy.id].severity === "red" ? "text-red-400" : 
                                  latestStatus[pregnancy.id].severity === "yellow" ? "text-yellow-400" : "text-emerald-400"
                                }`} />
                                <p className={`text-sm font-medium leading-relaxed ${
                                  latestStatus[pregnancy.id].severity === "red" ? "text-red-200" : 
                                  latestStatus[pregnancy.id].severity === "yellow" ? "text-yellow-200" : "text-emerald-200"
                                }`}>
                                  {latestStatus[pregnancy.id].message}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-sm leading-relaxed text-gray-300">
                              <span className="font-semibold text-white">This week:</span> {tip}
                            </p>
                          </div>

                          <div className="mt-6 flex flex-wrap items-center gap-2">
                            <Link href={`/mother/delivery/${pregnancy.id}`} prefetch={false} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:shadow-md">
                              I had my baby
                            </Link>
                            <Link href={`/mother/brief/pregnancy/${pregnancy.id}`} prefetch={false} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:shadow-md">
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
                              className="inline-flex items-center rounded-full border border-transparent px-4 py-2 text-xs font-medium text-gray-500 transition-colors hover:text-white"
                            >
                              Update (loss)
                            </button>
                          </div>

                          {!pregnancy.linked_doctor_id && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                              <LinkDoctorInline subjectType="pregnancy" subjectId={pregnancy.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!hasBaby && (
                  <div className="pt-4 text-center">
                    <Link href="/mother/onboarding?add=baby" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:shadow-lg">
                      <Plus className="h-4 w-4 text-[var(--primary)]" /> Add Baby Profile
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Baby section */}
            {babyProfiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--primary)]">Baby Care</h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>
                
                <div className="grid gap-6">
                  {babyProfiles.map(child => {
                    const ageDays = getBabyAgeDays(child.birth_date)
                    const stage = formatStage("child", {
                      birth_date: child.birth_date,
                      name: child.name,
                    })
                    const tip = getBabyTip(ageDays)
                    const lastCheckin = lastCheckins[child.id]

                    return (
                      <div key={child.id} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-1 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-2xl hover:shadow-[var(--primary)]/5 backdrop-blur-xl">
                        {/* Glow orb */}
                        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[var(--primary)]/10 blur-[80px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10 rounded-[2.3rem] bg-black/20 p-6 sm:p-8 backdrop-blur-md border border-white/5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stage}</h3>
                              </div>
                              <p className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                                <Calendar className="h-3.5 w-3.5" />
                                {lastCheckin ? `Last checked in ${timeAgo(lastCheckin)}` : "No check-ins yet"}
                                {child.linked_doctor_id && (
                                  <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Doctor Linked
                                  </span>
                                )}
                              </p>
                            </div>
                            
                            <Link href={`/mother/checkin?type=child&id=${child.id}`} className="group relative hidden sm:flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(199,143,98,0.3)] transition-all hover:bg-[var(--primary)]/90 hover:shadow-[0_0_25px_rgba(199,143,98,0.5)]">
                              Check In Now
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>

                          {latestStatus[child.id] && (
                            <div className={`mt-6 rounded-2xl border px-5 py-4 ${
                              latestStatus[child.id].severity === "red"
                                ? "border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                                : latestStatus[child.id].severity === "yellow"
                                ? "border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                                : "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            }`}>
                              <div className="flex items-start gap-3">
                                <BellRing className={`mt-0.5 h-5 w-5 shrink-0 ${
                                  latestStatus[child.id].severity === "red" ? "text-red-400" : 
                                  latestStatus[child.id].severity === "yellow" ? "text-yellow-400" : "text-emerald-400"
                                }`} />
                                <p className={`text-sm font-medium leading-relaxed ${
                                  latestStatus[child.id].severity === "red" ? "text-red-200" : 
                                  latestStatus[child.id].severity === "yellow" ? "text-yellow-200" : "text-emerald-200"
                                }`}>
                                  {latestStatus[child.id].message}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-sm leading-relaxed text-gray-300">
                              <span className="font-semibold text-white">This week:</span> {tip}
                            </p>
                          </div>

                          <div className="mt-6 flex flex-wrap items-center gap-2">
                            <Link href={`/mother/brief/child/${child.id}`} prefetch={false} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:shadow-md">
                              Pre-visit brief
                            </Link>
                          </div>

                          {!child.linked_doctor_id && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                              <LinkDoctorInline subjectType="child" subjectId={child.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!hasPregnancy && (
                  <div className="pt-4 text-center">
                    <Link href="/mother/onboarding?add=pregnancy" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:shadow-lg">
                      <Plus className="h-4 w-4 text-[var(--primary)]" /> Add Pregnancy Profile
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            
            {/* Recorded Check-ins */}
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="bg-black/20 px-6 py-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                  <Activity className="h-4 w-4 text-[var(--primary)]" />
                  Recorded Check-ins
                </h3>
              </div>
              <div className="p-6">
                {recentCheckins.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {recentCheckins.map((checkin) => {
                      const subjectName = checkin.subject_type === 'pregnancy' 
                        ? 'Pregnancy' 
                        : babyProfiles.find(b => b.id === checkin.subject_id)?.name || 'Baby'

                      return (
                        <div key={checkin.id} className="group relative flex items-start gap-3 rounded-2xl border border-white/5 bg-black/20 p-4 transition-all hover:border-white/10 hover:bg-black/40">
                          <div className={`mt-0.5 flex h-2 w-2 shrink-0 rounded-full ${
                            checkin.severity === "red" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" :
                            checkin.severity === "yellow" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" :
                            "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          }`} />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {subjectName}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                              {timeAgo(checkin.created_at)}
                            </p>
                            <p className={`mt-2 text-xs font-medium leading-relaxed line-clamp-2 ${
                              checkin.severity === "red" ? "text-red-300" :
                              checkin.severity === "yellow" ? "text-yellow-300" :
                              "text-emerald-300"
                            }`}>
                              {checkin.message}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-black/20 p-6 text-center">
                    <p className="text-sm text-[var(--muted-foreground)]">No check-ins recorded yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Widget */}
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">Quick Actions</p>
              
              <div className="space-y-3">
                <Link href="/mother/ask" prefetch={false} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl hover:border-[var(--primary)]/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)]/30 to-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Ask AI Assistant</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Instant medical insights</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/mother/appointments" prefetch={false} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-300 group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Appointments</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Manage schedule</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-2">
                <Link href="/mother/onboarding?add=pregnancy" prefetch={false}>
                  <Button variant="outline" className="w-full h-11 rounded-xl border-white/10 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 hover:text-white transition-all hover:scale-105">
                    <Plus className="mr-1.5 h-4 w-4 text-[var(--primary)]" /> Pregnancy
                  </Button>
                </Link>
                <Link href="/mother/onboarding?add=baby" prefetch={false}>
                  <Button variant="outline" className="w-full h-11 rounded-xl border-white/10 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 hover:text-white transition-all hover:scale-105">
                    <Plus className="mr-1.5 h-4 w-4 text-[var(--primary)]" /> Baby
                  </Button>
                </Link>
              </div>
            </section>

            {/* Upcoming Appointments */}
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">
                  Schedule
                </p>
                <Link href="/mother/appointments" prefetch={false} className="text-[10px] font-semibold uppercase tracking-widest text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
                  View All
                </Link>
              </div>
              
              {appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                  <Calendar className="mx-auto h-6 w-6 text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">No upcoming visits</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map(apt => (
                    <div key={apt.id} className="group rounded-2xl border border-white/5 bg-black/20 p-4 transition-colors hover:bg-white/5 hover:border-white/10">
                      <p className="text-sm font-semibold text-white group-hover:text-[var(--primary)] transition-colors">{apt.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
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

          </aside>
        </div>
      </main>

      <MedicalFooter />
    </div>
  )
}
