"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signOutAndRedirect } from "@/lib/auth-client"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatStage } from "@/lib/utils"
import {
  Activity,
  AlertTriangle,
  Bot,
  Copy,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Siren,
  Stethoscope,
  Users,
} from "lucide-react"

const DOCTOR_IMAGE =
  "https://images.pexels.com/photos/19957220/pexels-photo-19957220.jpeg?auto=compress&cs=tinysrgb&w=800"

interface Pregnancy {
  id: string
  mother_id: string
  due_date: string
  status: string
  profiles: { full_name: string | null } | null
}

interface Child {
  id: string
  mother_id: string
  name: string
  birth_date: string
  gender: string | null
  profiles: { full_name: string | null } | null
}

interface Flag {
  id: string
  mother_id: string
  subject_id: string
  subject_type: string
  rule_id: string
  severity: string
  message: string
  created_at: string
}

interface Props {
  doctorId: string
  doctorName: string
  specialty?: string | null
  clinicName?: string | null
  inviteCode: string | null
  pregnancies: Pregnancy[]
  babyProfiles: Child[]
  initialFlags: Flag[]
  initialLastCheckins: Record<string, string>
}

type Row = {
  subjectType: "pregnancy" | "child"
  subjectId: string
  motherId: string
  motherName: string
  stage: string
  lastCheckin: string | null
  topFlag: Flag | null
  severity: "red" | "yellow" | "green"
  isDemo?: boolean
}

const demoRows: Row[] = [
  {
    subjectType: "pregnancy",
    subjectId: "demo-red",
    motherId: "demo-aisha",
    motherName: "Aisha Bello",
    stage: "Week 32",
    lastCheckin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    topFlag: {
      id: "demo-red-flag",
      mother_id: "demo-aisha",
      subject_id: "demo-red",
      subject_type: "pregnancy",
      rule_id: "preg_preeclampsia_symptoms",
      severity: "red",
      message: "Severe headache with swelling reported. Review now.",
      created_at: new Date().toISOString(),
    },
    severity: "red",
    isDemo: true,
  },
  {
    subjectType: "child",
    subjectId: "demo-yellow",
    motherId: "demo-chioma",
    motherName: "Chioma Eze",
    stage: "Zara, 1 month",
    lastCheckin: new Date(Date.now() - 2 * 3600000).toISOString(),
    topFlag: {
      id: "demo-yellow-flag",
      mother_id: "demo-chioma",
      subject_id: "demo-yellow",
      subject_type: "child",
      rule_id: "child_low_diapers",
      severity: "yellow",
      message: "Low wet diaper count recorded today. Check soon.",
      created_at: new Date().toISOString(),
    },
    severity: "yellow",
    isDemo: true,
  },
  {
    subjectType: "child",
    subjectId: "demo-green",
    motherId: "demo-tomi",
    motherName: "Tomi Adebayo",
    stage: "Ethan, 5 weeks",
    lastCheckin: new Date(Date.now() - 8 * 3600000).toISOString(),
    topFlag: null,
    severity: "green",
    isDemo: true,
  },
]

function severityOrder(s: Row["severity"]) {
  return s === "red" ? 0 : s === "yellow" ? 1 : 2
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function severityLabel(s: Row["severity"]) {
  return s === "red" ? "Immediate" : s === "yellow" ? "Review soon" : "Stable"
}

function severityBadge(s: Row["severity"]) {
  if (s === "red") return "border-red-400/30 bg-red-500/12 text-red-100"
  if (s === "yellow") return "border-yellow-400/30 bg-yellow-500/12 text-yellow-100"
  return "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
}

function severityDot(s: Row["severity"]) {
  return s === "red" ? "bg-red-400" : s === "yellow" ? "bg-yellow-400" : "bg-emerald-400"
}

function TriageCard({ row }: { row: Row }) {
  const shell = (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-3.5 transition hover:border-[rgba(201,139,88,0.3)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${severityDot(row.severity)}`} />
            <span className="truncate text-sm font-semibold text-white">{row.motherName}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{row.stage}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${severityBadge(row.severity)}`}
        >
          {severityLabel(row.severity)}
        </span>
      </div>

      {row.topFlag && (
        <p className="mt-2.5 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[rgba(43,35,29,0.5)] px-2.5 py-2 text-xs leading-5 text-white">
          {row.topFlag.message}
        </p>
      )}

      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {row.lastCheckin ? timeAgo(row.lastCheckin) : "Awaiting first check-in"}
      </p>
    </div>
  )

  if (row.isDemo) return <div>{shell}</div>
  return (
    <Link href={`/doctor/patient/${row.subjectType}/${row.subjectId}`} className="block">
      {shell}
    </Link>
  )
}

export function DoctorDashboardClient({
  doctorName,
  specialty,
  clinicName,
  inviteCode,
  pregnancies,
  babyProfiles,
  initialFlags,
  initialLastCheckins,
}: Props) {
  const [flags, setFlags] = useState<Flag[]>(initialFlags)
  const [lastCheckins, setLastCheckins] = useState(initialLastCheckins)
  const [realtimePulse, setRealtimePulse] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const allSubjectIds = [
      ...pregnancies.map(p => p.id),
      ...babyProfiles.map(c => c.id),
    ]

    const flagSub = supabase
      .channel("doctor-flags")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "flags" }, payload => {
        const newFlag = payload.new as Flag
        if (allSubjectIds.includes(newFlag.subject_id)) {
          setFlags(prev => [newFlag, ...prev])
          setRealtimePulse(true)
          setTimeout(() => setRealtimePulse(false), 2200)
        }
      })
      .subscribe()

    const checkinSub = supabase
      .channel("doctor-checkins")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        payload => {
          const checkin = payload.new as { subject_id: string; created_at: string }
          if (allSubjectIds.includes(checkin.subject_id)) {
            setLastCheckins(prev => ({ ...prev, [checkin.subject_id]: checkin.created_at }))
            setRealtimePulse(true)
            setTimeout(() => setRealtimePulse(false), 2200)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(flagSub)
      supabase.removeChannel(checkinSub)
    }
  }, [pregnancies, babyProfiles, supabase])

  const flagsBySubject = flags.reduce(
    (acc, flag) => {
      if (!acc[flag.subject_id]) acc[flag.subject_id] = []
      acc[flag.subject_id].push(flag)
      return acc
    },
    {} as Record<string, Flag[]>
  )

  const getTopFlag = (subjectId: string): { flag: Flag | null; severity: Row["severity"] } => {
    const f = flagsBySubject[subjectId] || []
    const red = f.find(x => x.severity === "red")
    if (red) return { flag: red, severity: "red" }
    const yellow = f.find(x => x.severity === "yellow")
    if (yellow) return { flag: yellow, severity: "yellow" }
    return { flag: null, severity: "green" }
  }

  const rows: Row[] = [
    ...pregnancies.map(p => {
      const { flag, severity } = getTopFlag(p.id)
      return {
        subjectType: "pregnancy" as const,
        subjectId: p.id,
        motherId: p.mother_id,
        motherName: p.profiles?.full_name || "Unknown",
        stage: formatStage("pregnancy", { due_date: p.due_date }),
        lastCheckin: lastCheckins[p.id] || null,
        topFlag: flag,
        severity,
      }
    }),
    ...babyProfiles.map(c => {
      const { flag, severity } = getTopFlag(c.id)
      return {
        subjectType: "child" as const,
        subjectId: c.id,
        motherId: c.mother_id,
        motherName: c.profiles?.full_name || "Unknown",
        stage: formatStage("child", { birth_date: c.birth_date, name: c.name }),
        lastCheckin: lastCheckins[c.id] || null,
        topFlag: flag,
        severity,
      }
    }),
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))

  const displayRows = rows.length > 0 ? rows : demoRows
  const redRows = displayRows.filter(r => r.severity === "red")
  const yellowRows = displayRows.filter(r => r.severity === "yellow")
  const greenRows = displayRows.filter(r => r.severity === "green")
  const linkedMothers = new Set(displayRows.map(r => r.motherId)).size
  const firstCheckinPending = displayRows.filter(r => !r.lastCheckin).length

  const recentFeed = [...displayRows]
    .filter(r => r.lastCheckin)
    .sort((a, b) => new Date(b.lastCheckin!).getTime() - new Date(a.lastCheckin!).getTime())
    .slice(0, 5)

  async function signOut() {
    await signOutAndRedirect(supabase, "/login?role=doctor")
  }

  async function copyCode() {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.92)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(199,143,98,0.35)] bg-[rgba(199,143,98,0.12)] text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
              MD
            </div>
            <div>
              <p className="text-base font-semibold text-white leading-none">{doctorName}</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                {specialty || "Doctor dashboard"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {realtimePulse && (
              <span className="mr-2 flex items-center gap-1 rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-2.5 py-1 text-xs text-[var(--foreground)]">
                <RefreshCw className="h-3 w-3 animate-spin" /> Live
              </span>
            )}
            <Link href="/doctor/ask">
              <Button variant="ghost" size="icon" aria-label="Doctor AI">
                <Bot className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Link href="/doctor/settings">
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats + invite bar */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)]">
          <div className="grid lg:grid-cols-[1fr_280px]">
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-px divide-x divide-[var(--border)] p-0">
              {[
                {
                  icon: <Users className="h-4 w-4" />,
                  value: linkedMothers,
                  label: "Linked mothers",
                  accent: "",
                },
                {
                  icon: <Siren className="h-4 w-4 text-red-300" />,
                  value: redRows.length,
                  label: "Critical",
                  accent: redRows.length > 0 ? "text-red-200" : "",
                },
                {
                  icon: <AlertTriangle className="h-4 w-4 text-yellow-300" />,
                  value: yellowRows.length,
                  label: "Review soon",
                  accent: yellowRows.length > 0 ? "text-yellow-100" : "",
                },
                {
                  icon: <ShieldCheck className="h-4 w-4 text-emerald-300" />,
                  value: greenRows.length,
                  label: "Stable",
                  accent: "",
                },
                {
                  icon: <Stethoscope className="h-4 w-4" />,
                  value: firstCheckinPending,
                  label: "Awaiting",
                  accent: "",
                },
              ].map(stat => (
                <div key={stat.label} className="flex flex-1 flex-col items-center px-5 py-4 min-w-[80px]">
                  <div className="mb-1 text-[var(--muted-foreground)]">{stat.icon}</div>
                  <p className={`text-2xl font-semibold text-white ${stat.accent}`}>{stat.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Invite code — image-backed panel */}
            <div className="relative overflow-hidden border-t border-[var(--border)] lg:border-l lg:border-t-0">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${DOCTOR_IMAGE})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(43,37,31,0.9)] to-[rgba(43,37,31,0.6)]" />
              <div className="relative p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                  Invite code
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[0.12em] text-white">
                  {inviteCode || "—"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {clinicName || "Share with patients to link their check-ins here."}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={copyCode}
                    disabled={!inviteCode}
                    className="flex-1"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {copied ? "Copied!" : "Copy code"}
                  </Button>
                  <Link href="/doctor/settings">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[rgba(255,255,255,0.16)] bg-transparent text-white"
                    >
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 2xl:grid-cols-[1fr_280px]">
          {/* Triage lanes — primary content */}
          <section className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--primary)]">
                  Triage board
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Patient queue</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  {rows.length > 0 ? "Live" : "Demo"}
                </span>
                <Link href="/doctor/ask">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--border)] bg-transparent text-white"
                  >
                    <Stethoscope className="mr-1.5 h-3.5 w-3.5" /> Ask AI
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {/* Red lane */}
              <div className="rounded-xl border border-red-400/20 bg-red-500/6 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Siren className="h-4 w-4 text-red-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-200">
                    Red — immediate
                  </p>
                </div>
                <div className="space-y-2">
                  {redRows.length > 0 ? (
                    redRows.map(row => <TriageCard key={`red-${row.subjectId}`} row={row} />)
                  ) : (
                    <div className="rounded-lg border border-dashed border-red-300/20 bg-red-500/5 p-3 text-xs text-red-100/70">
                      No red cases right now.
                    </div>
                  )}
                </div>
              </div>

              {/* Yellow lane */}
              <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/6 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-100">
                    Yellow — review
                  </p>
                </div>
                <div className="space-y-2">
                  {yellowRows.length > 0 ? (
                    yellowRows.map(row => (
                      <TriageCard key={`yellow-${row.subjectId}`} row={row} />
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-yellow-300/20 bg-yellow-500/5 p-3 text-xs text-yellow-100/70">
                      No yellow cases right now.
                    </div>
                  )}
                </div>
              </div>

              {/* Green lane */}
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/6 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    Green — stable
                  </p>
                </div>
                <div className="space-y-2">
                  {greenRows.length > 0 ? (
                    greenRows.map(row => (
                      <TriageCard key={`green-${row.subjectId}`} row={row} />
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-emerald-300/20 bg-emerald-500/5 p-3 text-xs text-emerald-100/70">
                      No stable cases yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Sidebar — network activity */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-5">
              <p className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Activity className="h-3.5 w-3.5" /> Recent updates
              </p>

              {recentFeed.length > 0 ? (
                <div className="space-y-2">
                  {recentFeed.map(row => (
                    <Link
                      key={`feed-${row.subjectId}`}
                      href={row.isDemo ? "#" : `/doctor/patient/${row.subjectType}/${row.subjectId}`}
                      className="block rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.05)] px-3 py-2.5 transition hover:border-[rgba(201,139,88,0.3)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {row.motherName}
                        </p>
                        <span
                          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] ${severityBadge(row.severity)}`}
                        >
                          {severityLabel(row.severity)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {row.stage} · {row.lastCheckin ? timeAgo(row.lastCheckin) : "—"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.04)] p-4 text-sm text-[var(--muted-foreground)]">
                  No recent activity yet.
                </div>
              )}
            </section>

            {/* Quick nav */}
            <section className="space-y-2 rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
              <Link href="/doctor/ask">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[rgba(199,143,98,0.22)] bg-[rgba(199,143,98,0.08)] text-white"
                >
                  <Bot className="mr-2 h-4 w-4" /> Ask AI about a case
                </Button>
              </Link>
              <Link href="/doctor/settings">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[var(--border)] bg-transparent text-white"
                >
                  <Settings className="mr-2 h-4 w-4" /> Manage referral code
                </Button>
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
