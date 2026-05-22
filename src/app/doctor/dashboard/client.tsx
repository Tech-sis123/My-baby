"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  MessageSquare,
  ChevronRight,
  ArrowRight,
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

function severityLabel(s: Row["severity"]) {
  return s === "red" ? "Immediate" : s === "yellow" ? "Review" : "Stable"
}

function severityBadge(s: Row["severity"]) {
  if (s === "red") return "border-red-500/20 bg-red-500/10 text-red-500"
  if (s === "yellow") return "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
}

function severityDot(s: Row["severity"]) {
  return s === "red" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
         s === "yellow" ? "bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
         "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
}

function TriageCard({ row }: { row: Row }) {
  const shell = (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-[var(--background)] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
      row.severity === "red" ? "border-red-500/20 hover:border-red-500/40" :
      row.severity === "yellow" ? "border-yellow-500/20 hover:border-yellow-500/40" :
      "border-white/5 hover:border-white/10"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${severityDot(row.severity)}`} />
            <span className="truncate text-[15px] font-semibold text-gray-100 group-hover:text-white transition-colors">{row.motherName}</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.1em] text-gray-400">{row.stage}</p>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${severityBadge(row.severity)}`}>
          {severityLabel(row.severity)}
        </span>
      </div>

      {row.latestStatus && (
        <div className="mt-4 rounded-lg bg-[var(--card)] p-3 border border-white/5">
          <p className={`text-[13px] font-medium leading-snug ${
            row.severity === "red" ? "text-red-400" :
            row.severity === "yellow" ? "text-yellow-400" :
            "text-gray-300"
          }`}>
            {row.latestStatus.message}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] font-medium text-gray-500">
          {row.lastCheckin ? timeAgo(row.lastCheckin) : "—"}
        </p>
        <ArrowRight className={`h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 ${
          row.severity === "red" ? "text-red-400" :
          row.severity === "yellow" ? "text-yellow-400" :
          "text-emerald-400"
        }`} />
      </div>
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

  async function signOut() {
    await signOutAndRedirect(supabase, "/login?role=doctor")
  }

  async function copyCode() {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isSeeding || (pregnancies.length === 0 && babyProfiles.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--primary)]/30 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <RefreshCw className="h-8 w-8 text-[var(--primary)] animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Preparing Demo Environment</h2>
            <p className="text-sm text-gray-400">Generating simulated patients, chat messages, and flags...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-gray-100 font-sans selection:bg-[var(--primary)]/30">
      
      {/* Header - Solid elevated surface */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[var(--card)] px-6 py-4 shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--background)] border border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-300">MD</span>
            </div>
            <div>
              <p className="text-base font-semibold leading-tight text-white">Dr. {doctorName}</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500">
                {specialty || "Doctor dashboard"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {realtimePulse && (
              <span className="mr-4 flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                <RefreshCw className="h-3 w-3 animate-spin" /> Live
              </span>
            )}
            <Link href="/doctor/messages">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:bg-white/5 hover:text-white">
                <MessageSquare className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Link href="/doctor/ask">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:bg-white/5 hover:text-white">
                <Bot className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Link href="/doctor/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:bg-white/5 hover:text-white">
                <Settings className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <div className="mx-2 h-4 w-px bg-white/10" />
            <Button variant="ghost" size="icon" onClick={signOut} className="h-9 w-9 text-gray-400 hover:bg-red-500/10 hover:text-red-400">
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Top Stats - Exact identical dimensions and padding */}
        <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Users className="h-5 w-5" />,
              value: linkedMothers,
              label: "Linked Patients",
              iconColor: "text-blue-400",
              iconBg: "bg-blue-500/10",
              valueColor: "text-white"
            },
            {
              icon: <Siren className="h-5 w-5" />,
              value: redRows.length,
              label: "Critical",
              iconColor: "text-red-500",
              iconBg: "bg-red-500/10",
              valueColor: redRows.length > 0 ? "text-red-500" : "text-white"
            },
            {
              icon: <AlertTriangle className="h-5 w-5" />,
              value: yellowRows.length,
              label: "Review Soon",
              iconColor: "text-yellow-500",
              iconBg: "bg-yellow-500/10",
              valueColor: yellowRows.length > 0 ? "text-yellow-500" : "text-white"
            },
            {
              icon: <ShieldCheck className="h-5 w-5" />,
              value: greenRows.length,
              label: "Stable",
              iconColor: "text-emerald-500",
              iconBg: "bg-emerald-500/10",
              valueColor: "text-white"
            },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col justify-center rounded-xl border border-white/5 bg-[var(--card)] p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.iconBg} ${stat.iconColor}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className={`text-3xl font-bold leading-none tracking-tight ${stat.valueColor}`}>{stat.value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Workspace */}
          <div className="space-y-8">
            
            {/* Invite Hero - The single allowed glass/photo element */}
            <section className="relative overflow-hidden rounded-xl border border-white/5 bg-[var(--card)] shadow-md group h-48">
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-40 transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${DOCTOR_IMAGE})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--card)] via-[var(--card)] to-transparent" />
              <div className="absolute inset-0 bg-black/20" />
              
              <div className="relative flex h-full flex-col justify-center p-8 lg:w-2/3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--primary)]">
                  Referral Code
                </p>
                <div className="mt-2 flex items-end gap-6">
                  <h3 className="text-4xl font-black tracking-widest text-white">
                    {inviteCode || "—"}
                  </h3>
                  <Button
                    onClick={copyCode}
                    disabled={!inviteCode}
                    className="mb-1 rounded-md bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 px-6 font-semibold"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="mt-3 text-sm text-gray-300">
                  {clinicName ? `${clinicName} • Share this code with new patients` : "Share this code to link patients"}
                </p>
              </div>
            </section>

            {/* Triage Board - The Primary Workflow */}
            <section>
              <div className="mb-6 flex items-baseline justify-between border-b border-white/5 pb-4">
                <h2 className="font-display text-2xl font-bold text-white tracking-tight">Patient Queue</h2>
                <span className="rounded bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {rows.length > 0 ? "Live Data" : "Demo"}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Red Lane */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-4 py-3 border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <Siren className="h-4 w-4 text-red-500" />
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-red-500">Immediate</h3>
                    </div>
                    <span className="text-sm font-bold text-red-400">{redRows.length}</span>
                  </div>
                  
                  {redRows.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {redRows.map(row => <TriageCard key={`red-${row.subjectId}`} row={row} />)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-white/5 bg-[var(--card)] py-6">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Clear</p>
                    </div>
                  )}
                </div>

                {/* Yellow Lane */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-yellow-500/10 px-4 py-3 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-yellow-500">Review</h3>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">{yellowRows.length}</span>
                  </div>
                  
                  {yellowRows.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {yellowRows.map(row => <TriageCard key={`yellow-${row.subjectId}`} row={row} />)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-white/5 bg-[var(--card)] py-6">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Clear</p>
                    </div>
                  )}
                </div>

                {/* Green Lane */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-4 py-3 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">Stable</h3>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{greenRows.length}</span>
                  </div>
                  
                  {greenRows.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {greenRows.map(row => <TriageCard key={`green-${row.subjectId}`} row={row} />)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-white/5 bg-[var(--card)] py-6">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Clear</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            
            <section className="rounded-xl border border-white/5 bg-[var(--card)] p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <Link href="/doctor/ask" className="group flex items-center justify-between rounded-lg border border-white/5 bg-[var(--background)] p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <Bot className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                    <div>
                      <p className="text-sm font-semibold text-gray-100">AI Assistant</p>
                      <p className="text-[11px] font-medium text-gray-500">Clinical insights</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white" />
                </Link>

                <Link href="/doctor/settings" className="group flex items-center justify-between rounded-lg border border-white/5 bg-[var(--background)] p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <Settings className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                    <div>
                      <p className="text-sm font-semibold text-gray-100">Settings</p>
                      <p className="text-[11px] font-medium text-gray-500">Manage profile</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white" />
                </Link>
              </div>
            </section>

            <section className="rounded-xl border border-white/5 bg-[var(--card)] p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <h3 className="font-display text-lg font-bold text-white">Recent Updates</h3>
              </div>

              {recentFeed.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {recentFeed.map(row => (
                    <Link
                      key={`feed-${row.subjectId}`}
                      href={row.isDemo ? "#" : `/doctor/patient/${row.subjectType}/${row.subjectId}`}
                      className="group flex flex-col gap-2 rounded-lg border border-white/5 bg-[var(--background)] p-4 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${severityDot(row.severity)}`} />
                          <p className="truncate text-sm font-semibold text-gray-100 group-hover:text-white">
                            {row.motherName}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded text-[9px] font-bold uppercase tracking-wider ${
                          row.severity === "red" ? "text-red-400" :
                          row.severity === "yellow" ? "text-yellow-400" :
                          "text-emerald-400"
                        }`}>
                          {severityLabel(row.severity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-gray-400">
                          {row.stage}
                        </p>
                        <p className="text-[10px] font-medium text-gray-500">
                          {row.lastCheckin ? timeAgo(row.lastCheckin) : "—"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/5 bg-[var(--background)] p-6 text-center">
                  <p className="text-[12px] font-medium text-gray-500">No recent activity.</p>
                </div>
              )}
            </section>

          </aside>
        </div>
      </main>
    </div>
  )
}
