"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatStage } from "@/lib/utils"
import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  ClipboardList,
  Copy,
  HeartPulse,
  LayoutDashboard,
  Link2,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Siren,
  Stethoscope,
  TimerReset,
  Users,
} from "lucide-react"

const DOCTOR_DASHBOARD_IMAGE =
  "https://images.pexels.com/photos/19957220/pexels-photo-19957220.jpeg?auto=compress&cs=tinysrgb&w=1200"

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

function severityOrder(severity: Row["severity"]) {
  if (severity === "red") return 0
  if (severity === "yellow") return 1
  return 2
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function severityLabel(severity: Row["severity"]) {
  if (severity === "red") return "Immediate attention"
  if (severity === "yellow") return "Review soon"
  return "Stable"
}

function severityBadge(severity: Row["severity"]) {
  if (severity === "red") return "border-red-400/30 bg-red-500/12 text-red-100"
  if (severity === "yellow") return "border-yellow-400/30 bg-yellow-500/12 text-yellow-100"
  return "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
}

function severityDot(severity: Row["severity"]) {
  if (severity === "red") return "bg-red-400"
  if (severity === "yellow") return "bg-yellow-400"
  return "bg-emerald-400"
}

function QueueCard({ row, compact = false }: { row: Row; compact?: boolean }) {
  const shell = (
    <div className="rounded-[1.55rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4 transition hover:border-[rgba(201,139,88,0.34)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${severityDot(row.severity)}`} />
            <span className="text-lg font-semibold text-white">{row.motherName}</span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[var(--muted-foreground)]">
            {row.subjectType === "pregnancy" ? "Pregnancy track" : "Baby track"} · {row.stage}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${severityBadge(row.severity)}`}>
          {severityLabel(row.severity)}
        </span>
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(57,46,39,0.5)] p-3.5">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Priority note</p>
        <p className="mt-2 text-sm leading-6 text-white">
          {row.topFlag?.message || "No active warning signs. Continue routine follow-up."}
        </p>
      </div>

      {compact ? (
        <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          <span>{row.lastCheckin ? `Updated ${timeAgo(row.lastCheckin)}` : "Awaiting first check-in"}</span>
          <span>{row.subjectType === "pregnancy" ? "Preg" : "Baby"}</span>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-3.5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Last update</p>
            <p className="mt-2 text-sm font-medium text-white">
              {row.lastCheckin ? timeAgo(row.lastCheckin) : "Awaiting first check-in"}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-3.5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Care track</p>
            <p className="mt-2 text-sm font-medium text-white">
              {row.subjectType === "pregnancy" ? "Pregnancy monitoring" : "Baby monitoring"}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-3.5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Case status</p>
            <p className="mt-2 text-sm font-medium text-white">{severityLabel(row.severity)}</p>
          </div>
        </div>
      )}
    </div>
  )

  if (row.isDemo) return <div>{shell}</div>

  return (
    <Link href={`/doctor/patient/${row.subjectType}/${row.subjectId}`} className="block">
      {shell}
    </Link>
  )
}

function MetricCard({
  label,
  value,
  note,
  accent,
  icon,
}: {
  label: string
  value: string | number
  note: string
  accent: string
  icon: React.ReactNode
}) {
  return (
    <div className={`rounded-[1.4rem] border p-4 ${accent}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em]">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{note}</p>
    </div>
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
  const router = useRouter()
  const [flags, setFlags] = useState<Flag[]>(initialFlags)
  const [lastCheckins, setLastCheckins] = useState(initialLastCheckins)
  const [realtimePulse, setRealtimePulse] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const allSubjectIds = [...pregnancies.map(pregnancy => pregnancy.id), ...babyProfiles.map(child => child.id)]

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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "checkins" }, payload => {
        const checkin = payload.new as { subject_id: string; created_at: string }
        if (allSubjectIds.includes(checkin.subject_id)) {
          setLastCheckins(prev => ({ ...prev, [checkin.subject_id]: checkin.created_at }))
          setRealtimePulse(true)
          setTimeout(() => setRealtimePulse(false), 2200)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(flagSub)
      supabase.removeChannel(checkinSub)
    }
  }, [pregnancies, babyProfiles, supabase])

  const flagsBySubject = flags.reduce((acc, flag) => {
    if (!acc[flag.subject_id]) acc[flag.subject_id] = []
    acc[flag.subject_id].push(flag)
    return acc
  }, {} as Record<string, Flag[]>)

  const getTopFlag = (subjectId: string): { flag: Flag | null; severity: Row["severity"] } => {
    const subjectFlags = flagsBySubject[subjectId] || []
    const red = subjectFlags.find(flag => flag.severity === "red")
    if (red) return { flag: red, severity: "red" }
    const yellow = subjectFlags.find(flag => flag.severity === "yellow")
    if (yellow) return { flag: yellow, severity: "yellow" }
    return { flag: null, severity: "green" }
  }

  const rows: Row[] = [
    ...pregnancies.map(pregnancy => {
      const { flag, severity } = getTopFlag(pregnancy.id)
      return {
        subjectType: "pregnancy" as const,
        subjectId: pregnancy.id,
        motherId: pregnancy.mother_id,
        motherName: pregnancy.profiles?.full_name || "Unknown",
        stage: formatStage("pregnancy", { due_date: pregnancy.due_date }),
        lastCheckin: lastCheckins[pregnancy.id] || null,
        topFlag: flag,
        severity,
      }
    }),
    ...babyProfiles.map(child => {
      const { flag, severity } = getTopFlag(child.id)
      return {
        subjectType: "child" as const,
        subjectId: child.id,
        motherId: child.mother_id,
        motherName: child.profiles?.full_name || "Unknown",
        stage: formatStage("child", { birth_date: child.birth_date, name: child.name }),
        lastCheckin: lastCheckins[child.id] || null,
        topFlag: flag,
        severity,
      }
    }),
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))

  const displayRows = rows.length > 0 ? rows : demoRows
  const redRows = displayRows.filter(row => row.severity === "red")
  const yellowRows = displayRows.filter(row => row.severity === "yellow")
  const greenRows = displayRows.filter(row => row.severity === "green")
  const linkedMothers = new Set(displayRows.map(row => row.motherId)).size
  const pregnancyCount = displayRows.filter(row => row.subjectType === "pregnancy").length
  const babyCount = displayRows.filter(row => row.subjectType === "child").length
  const firstCheckinPending = displayRows.filter(row => !row.lastCheckin).length
  const recentFeed = [...displayRows]
    .filter(row => row.lastCheckin)
    .sort((a, b) => new Date(b.lastCheckin || 0).getTime() - new Date(a.lastCheckin || 0).getTime())
    .slice(0, 5)

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  async function copyCode() {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(199,143,98,0.35)] bg-[rgba(199,143,98,0.12)] text-sm font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
              MD
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Doctor dashboard</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">{doctorName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {realtimePulse ? (
              <span className="flex items-center gap-1 rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-3 py-1 text-xs text-[var(--foreground)]">
                <RefreshCw className="h-3 w-3 animate-spin" /> Live update
              </span>
            ) : null}
            <Link href="/doctor/ask">
              <Button variant="ghost" size="icon" aria-label="Doctor AI">
                <Bot className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/doctor/settings">
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <section className="panel-float overflow-hidden rounded-[2.25rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                <LayoutDashboard className="h-3.5 w-3.5" /> Linked care command center
              </div>

              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                A real working board for one doctor managing several linked mothers and babies.
              </h2>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)]">
                <span>{specialty || "Maternal care doctor"}</span>
                {clinicName ? <span>· {clinicName}</span> : null}
                <span>· Invite-code linkage active</span>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                Every linked account feeds into this board. Red cases rise first, yellow cases stay visible, and stable patients remain easy to monitor without crowding urgent review.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Linked mothers"
                  value={linkedMothers}
                  note="Unique mothers connected to your care network."
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                  icon={<Users className="h-4 w-4 text-[var(--foreground)]" />}
                />
                <MetricCard
                  label="Critical queue"
                  value={redRows.length}
                  note="Cases that should be reviewed immediately."
                  accent="border-red-400/25 bg-red-500/10 text-red-100"
                  icon={<Siren className="h-4 w-4 text-red-200" />}
                />
                <MetricCard
                  label="Review soon"
                  value={yellowRows.length}
                  note="Cases needing follow-up next."
                  accent="border-yellow-400/25 bg-yellow-500/10 text-yellow-100"
                  icon={<AlertTriangle className="h-4 w-4 text-yellow-100" />}
                />
                <MetricCard
                  label="No first update"
                  value={firstCheckinPending}
                  note="Linked cases still waiting for a first check-in."
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                  icon={<TimerReset className="h-4 w-4 text-[var(--foreground)]" />}
                />
              </div>
            </div>

            <div className="relative min-h-[320px] border-t border-[var(--border)] xl:min-h-full xl:border-l xl:border-t-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(to top, rgba(58,46,38,0.78), rgba(58,46,38,0.14)), url(${DOCTOR_DASHBOARD_IMAGE})` }}
              />
              <div className="relative flex h-full flex-col justify-between p-6">
                <div className="self-end rounded-full border border-[rgba(255,248,239,0.18)] bg-[rgba(255,248,239,0.1)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-white">
                  {realtimePulse ? "Live updates" : "Triage ready"}
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[1.45rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(42,34,28,0.62)] p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.76)]">
                      <Link2 className="h-4 w-4" /> Invite code
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">{inviteCode || "Generate yours"}</p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(255,255,255,0.76)]">
                      Use one code to connect multiple mothers and baby-care tracks back to your dashboard.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Button onClick={copyCode} disabled={!inviteCode} className="flex-1">
                        <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy code"}
                      </Button>
                      <Link href="/doctor/settings" className="flex-1">
                        <Button variant="outline" className="w-full border-[rgba(255,255,255,0.16)] bg-transparent text-white">
                          Settings
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-[1.45rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(42,34,28,0.62)] p-4 backdrop-blur">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.62)]">Pregnancy</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{pregnancyCount}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.62)]">Baby</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{babyCount}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.62)]">Stable</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{greenRows.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">Severity board</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">Operational triage lanes</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                    This is the main working area: urgent cases first, follow-up next, stable watchlist last.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    {rows.length > 0 ? "Realtime board" : "Demo board"}
                  </div>
                  <Link href="/doctor/ask">
                    <Button variant="outline" className="border-[var(--border)] bg-transparent text-white">
                      <Stethoscope className="h-4 w-4" /> Ask AI
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <div className="rounded-[1.6rem] border border-red-400/22 bg-red-500/8 p-4">
                  <div className="flex items-center gap-2 text-red-200">
                    <Siren className="h-4 w-4" />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]">Red lane</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-red-100/90">Immediate attention and high-risk cases.</p>
                  <div className="mt-4 space-y-3">
                    {redRows.length > 0 ? redRows.map(row => (
                      <QueueCard key={`red-${row.subjectId}`} row={row} compact />
                    )) : (
                      <div className="rounded-[1.35rem] border border-dashed border-red-300/25 bg-red-500/6 p-4 text-sm text-red-100/80">
                        No red cases right now.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-yellow-400/22 bg-yellow-500/8 p-4">
                  <div className="flex items-center gap-2 text-yellow-100">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]">Yellow lane</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-yellow-100/90">Review soon and keep visible.</p>
                  <div className="mt-4 space-y-3">
                    {yellowRows.length > 0 ? yellowRows.map(row => (
                      <QueueCard key={`yellow-${row.subjectId}`} row={row} compact />
                    )) : (
                      <div className="rounded-[1.35rem] border border-dashed border-yellow-300/25 bg-yellow-500/6 p-4 text-sm text-yellow-100/80">
                        No yellow cases right now.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-emerald-400/22 bg-emerald-500/8 p-4">
                  <div className="flex items-center gap-2 text-emerald-100">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]">Green lane</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/90">Stable cases and routine watchlist.</p>
                  <div className="mt-4 space-y-3">
                    {greenRows.length > 0 ? greenRows.map(row => (
                      <QueueCard key={`green-${row.subjectId}`} row={row} compact />
                    )) : (
                      <div className="rounded-[1.35rem] border border-dashed border-emerald-300/25 bg-emerald-500/6 p-4 text-sm text-emerald-100/80">
                        No stable cases yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <ClipboardList className="h-4 w-4" /> Full patient queue
              </div>
              <div className="mt-5 grid gap-4">
                {displayRows.map(row => (
                  <QueueCard key={`full-${row.subjectId}`} row={row} />
                ))}
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Activity className="h-4 w-4" /> Network activity
              </div>
              {recentFeed.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {recentFeed.map(row => (
                    <div key={`recent-${row.subjectId}`} className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{row.motherName}</p>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            {row.subjectType === "pregnancy" ? "Pregnancy" : "Baby care"} · {row.stage}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${severityBadge(row.severity)}`}>
                          {severityLabel(row.severity)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-white">
                        {row.lastCheckin ? `Updated ${timeAgo(row.lastCheckin)}` : "Awaiting first check-in"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.35rem] border border-dashed border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                  No recent activity yet.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <HeartPulse className="h-4 w-4" /> Referral workflow
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Step 1</p>
                  <p className="mt-2 text-sm leading-6 text-white">Share your invite code with mothers you want linked to your board.</p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Step 2</p>
                  <p className="mt-2 text-sm leading-6 text-white">They enter the code during onboarding or later from their dashboard.</p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Step 3</p>
                  <p className="mt-2 text-sm leading-6 text-white">Their check-ins, red flags, and baby or pregnancy updates appear here automatically.</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Building2 className="h-4 w-4" /> Practice snapshot
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Doctor</p>
                  <p className="mt-2 text-sm font-medium text-white">{doctorName}</p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Specialty</p>
                  <p className="mt-2 text-sm font-medium text-white">{specialty || "Maternal and child care"}</p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.06)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Clinic</p>
                  <p className="mt-2 text-sm font-medium text-white">{clinicName || "Set in doctor settings"}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
