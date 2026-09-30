"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn, formatStage } from "@/lib/utils"
import { AppHeader } from "@/components/app/app-header"
import {
  EmptyState,
  SEVERITY_LABEL,
  SEVERITY_RAIL,
  SEVERITY_TEXT,
  SeverityBadge,
  SeverityDot,
  StatTile,
} from "@/components/app/status"
import {
  Activity,
  AlertTriangle,
  Baby,
  Bot,
  Check,
  ChevronRight,
  Copy,
  HeartPulse,
  LoaderCircle,
  MessageSquare,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react"

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
  initialLatestCheckinsData?: Record<string, { severity: string; message: string }>
}

type Row = {
  subjectType: "pregnancy" | "child"
  subjectId: string
  motherId: string
  motherName: string
  stage: string
  lastCheckin: string | null
  latestStatus: { severity: string; message: string } | null
  topFlag: Flag | null
  severity: "red" | "yellow" | "green"
  isDemo?: boolean
}

type Filter = "all" | Row["severity"]

const demoRows: Row[] = [
  {
    subjectType: "pregnancy",
    subjectId: "demo-red",
    motherId: "demo-aisha",
    motherName: "Aisha Bello",
    stage: "Week 32",
    lastCheckin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    latestStatus: { severity: "red", message: "Severe headache with swelling reported. Review now." },
    topFlag: null,
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
    latestStatus: { severity: "yellow", message: "Low wet diaper count recorded today. Check soon." },
    topFlag: null,
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
    latestStatus: { severity: "green", message: "All clear. Feeding well." },
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

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

const ROW_GRID = "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_100px_120px_16px]"

function PatientRow({ row }: { row: Row }) {
  const Icon = row.subjectType === "pregnancy" ? HeartPulse : Baby
  const body = (
    <div
      className={cn(
        "group relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5",
        ROW_GRID,
        "before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r-full",
        SEVERITY_RAIL[row.severity],
        !row.isDemo && "hover:bg-white/[0.025]"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[11px] font-semibold text-slate-200 ring-1 ring-[var(--hairline)]">
          {initials(row.motherName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{row.motherName}</p>
          <p className="flex items-center gap-1 truncate text-xs text-[var(--muted-foreground)]">
            <Icon className="h-3 w-3 shrink-0" /> {row.stage}
          </p>
        </div>
      </div>

      <p
        className={cn(
          "col-span-2 line-clamp-2 text-[13px] leading-snug md:col-span-1",
          row.severity === "green" ? "text-slate-400" : SEVERITY_TEXT[row.severity]
        )}
      >
        {row.latestStatus?.message || "No check-in yet"}
      </p>

      <p className="num hidden text-xs text-[var(--muted-foreground)] md:block">
        {row.lastCheckin ? timeAgo(row.lastCheckin) : "—"}
      </p>

      <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
        <SeverityBadge severity={row.severity} />
      </div>

      <ChevronRight className="hidden h-4 w-4 text-slate-600 group-hover:text-slate-300 md:block" />
    </div>
  )

  if (row.isDemo) return <li>{body}</li>
  return (
    <li>
      <Link href={`/doctor/patient/${row.subjectType}/${row.subjectId}`} className="block">
        {body}
      </Link>
    </li>
  )
}

export function DoctorDashboardClient({
  doctorId,
  doctorName,
  specialty,
  clinicName,
  inviteCode,
  pregnancies,
  babyProfiles,
  initialFlags,
  initialLastCheckins,
  initialLatestCheckinsData = {},
}: Props) {
  const [flags, setFlags] = useState<Flag[]>(initialFlags)
  const [lastCheckins, setLastCheckins] = useState(initialLastCheckins)
  const [latestCheckinsData, setLatestCheckinsData] = useState(initialLatestCheckinsData)
  const [realtimePulse, setRealtimePulse] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")

  const supabase = createClient()
  const router = useRouter()

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
          const checkin = payload.new as { subject_id: string; created_at: string; severity?: string; message?: string }
          if (allSubjectIds.includes(checkin.subject_id)) {
            setLastCheckins(prev => ({ ...prev, [checkin.subject_id]: checkin.created_at }))
            setLatestCheckinsData(prev => ({
              ...prev,
              [checkin.subject_id]: { severity: checkin.severity || "green", message: checkin.message || "All clear." }
            }))
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

  useEffect(() => {
    if (pregnancies.length === 0 && babyProfiles.length === 0 && !isSeeding) {
      setIsSeeding(true)
      fetch("/api/seed-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId })
      }).then(res => res.json()).then(() => {
        router.refresh()
      }).catch(() => {
        setIsSeeding(false)
      })
    }
  }, [pregnancies.length, babyProfiles.length, doctorId])

  // Flags are kept in sync via realtime; row severity is driven by the latest check-in.
  void flags

  const rows: Row[] = [
    ...pregnancies.map(p => {
      const latestCheckinData = latestCheckinsData[p.id]
      const severity = (latestCheckinData?.severity as Row["severity"]) || "green"
      return {
        subjectType: "pregnancy" as const,
        subjectId: p.id,
        motherId: p.mother_id,
        motherName: p.profiles?.full_name || "Unknown",
        stage: formatStage("pregnancy", { due_date: p.due_date }),
        lastCheckin: lastCheckins[p.id] || null,
        latestStatus: latestCheckinData || null,
        topFlag: null,
        severity,
      }
    }),
    ...babyProfiles.map(c => {
      const latestCheckinData = latestCheckinsData[c.id]
      const severity = (latestCheckinData?.severity as Row["severity"]) || "green"
      return {
        subjectType: "child" as const,
        subjectId: c.id,
        motherId: c.mother_id,
        motherName: c.profiles?.full_name || "Unknown",
        stage: formatStage("child", { birth_date: c.birth_date, name: c.name }),
        lastCheckin: lastCheckins[c.id] || null,
        latestStatus: latestCheckinData || null,
        topFlag: null,
        severity,
      }
    }),
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))

  const displayRows = rows.length > 0 ? rows : demoRows
  const redRows = displayRows.filter(r => r.severity === "red")
  const yellowRows = displayRows.filter(r => r.severity === "yellow")
  const greenRows = displayRows.filter(r => r.severity === "green")
  const linkedMothers = new Set(displayRows.map(r => r.motherId)).size

  const recentFeed = [...displayRows]
    .filter(r => r.lastCheckin)
    .sort((a, b) => new Date(b.lastCheckin!).getTime() - new Date(a.lastCheckin!).getTime())
    .slice(0, 5)

  async function copyCode() {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isSeeding || (pregnancies.length === 0 && babyProfiles.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="motion-rise flex max-w-sm flex-col items-center text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <h2 className="mt-5 text-lg font-semibold text-white">Preparing your workspace</h2>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            Setting up sample patients, check-ins and messages so you can explore the dashboard.
          </p>
        </div>
      </div>
    )
  }

  const filtered = filter === "all" ? displayRows : displayRows.filter(r => r.severity === filter)
  const filters: Array<{ value: Filter; label: string; count: number }> = [
    { value: "all", label: "All", count: displayRows.length },
    { value: "red", label: SEVERITY_LABEL.red, count: redRows.length },
    { value: "yellow", label: SEVERITY_LABEL.yellow, count: yellowRows.length },
    { value: "green", label: SEVERITY_LABEL.green, count: greenRows.length },
  ]

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <AppHeader
        role="doctor"
        userName={`Dr. ${doctorName}`}
        userMeta={specialty || clinicName || undefined}
        right={
          <span
            className={cn(
              "hidden items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset sm:inline-flex",
              realtimePulse ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" : "text-slate-400 ring-[var(--hairline)]"
            )}
          >
            <SeverityDot severity="green" />
            {realtimePulse ? "New update" : "Live"}
          </span>
        }
      />

      <main className="page motion-rise py-8 sm:py-10">
        {/* Title */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-[28px]">Patient overview</h1>
            <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">
              {clinicName ? `${clinicName} · ` : ""}Sorted by clinical priority. Updates arrive in real time.
            </p>
          </div>
          <div className="surface flex items-center justify-between gap-3 py-2 pl-4 pr-2">
            <div className="leading-tight">
              <p className="data-label">Referral code</p>
              <p className="font-mono text-base font-semibold tracking-wider text-white">{inviteCode || "—"}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={copyCode} disabled={!inviteCode}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Linked patients" value={linkedMothers} icon={<Users className="h-4 w-4" />} />
          <StatTile label="Urgent" value={redRows.length} tone="red" icon={<Siren className="h-4 w-4" />} hint="Review now" />
          <StatTile label="Review soon" value={yellowRows.length} tone="yellow" icon={<AlertTriangle className="h-4 w-4" />} hint="Within 24 hours" />
          <StatTile label="Stable" value={greenRows.length} tone="green" icon={<ShieldCheck className="h-4 w-4" />} hint="Routine follow-up" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Triage queue */}
          <section className="surface overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--hairline)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Triage queue</h2>
                {rows.length === 0 ? (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Demo</span>
                ) : null}
              </div>
              <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filter by priority">
                {filters.map(f => (
                  <button
                    key={f.value}
                    role="tab"
                    aria-selected={filter === f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                      filter === f.value ? "bg-white/[0.08] text-white" : "text-[var(--muted-foreground)] hover:text-white"
                    )}
                  >
                    {f.value !== "all" ? <SeverityDot severity={f.value} className="h-1.5 w-1.5" /> : null}
                    {f.label}
                    <span className="num text-slate-500">{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("hidden gap-x-4 border-b border-[var(--hairline)] bg-black/10 px-5 py-2 md:grid", ROW_GRID)}>
              {["Patient", "Latest report", "Last check-in", "Priority", ""].map((h, i) => (
                <p key={i} className="data-label">{h}</p>
              ))}
            </div>

            {filtered.length > 0 ? (
              <ul className="divide-y divide-[var(--hairline)]">
                {filtered.map(row => <PatientRow key={`${row.subjectType}-${row.subjectId}`} row={row} />)}
              </ul>
            ) : (
              <EmptyState
                className="m-5 border-0"
                icon={<ShieldCheck className="h-5 w-5" />}
                title="No patients in this lane"
                description="Everyone here has been triaged elsewhere."
              />
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <section className="surface p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <Activity className="h-4 w-4 text-[var(--muted-foreground)]" /> Recent activity
              </h2>
              {recentFeed.length > 0 ? (
                <ol className="space-y-3.5">
                  {recentFeed.map(row => (
                    <li key={`feed-${row.subjectId}`}>
                      <Link
                        href={row.isDemo ? "#" : `/doctor/patient/${row.subjectType}/${row.subjectId}`}
                        className="group flex items-start gap-3"
                      >
                        <SeverityDot severity={row.severity} className="mt-1.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-sm font-medium text-slate-100 group-hover:text-white">{row.motherName}</p>
                            <span className="num shrink-0 text-[11px] text-slate-500">{row.lastCheckin ? timeAgo(row.lastCheckin) : "—"}</span>
                          </div>
                          <p className="truncate text-xs text-[var(--muted-foreground)]">{row.stage}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No recent activity.</p>
              )}
            </section>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <Link href="/doctor/ask" className="surface flex items-center gap-3 p-4 hover:border-[var(--primary-line)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Bot className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Clinical copilot</p>
                  <p className="hidden truncate text-xs text-[var(--muted-foreground)] sm:block">Triage & follow-up support</p>
                </div>
              </Link>
              <Link href="/doctor/messages" className="surface flex items-center gap-3 p-4 hover:border-slate-500">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-slate-300">
                  <MessageSquare className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Messages</p>
                  <p className="hidden truncate text-xs text-[var(--muted-foreground)] sm:block">Chat with linked mothers</p>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
