"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatStage, SEVERITY_DOT } from "@/lib/utils"
import { Settings, LogOut, RefreshCw } from "lucide-react"

interface Pregnancy {
  id: string; mother_id: string; due_date: string; status: string
  profiles: { full_name: string | null } | null
}
interface Child {
  id: string; mother_id: string; name: string; birth_date: string; gender: string | null
  profiles: { full_name: string | null } | null
}
interface Flag {
  id: string; mother_id: string; subject_id: string; subject_type: string
  rule_id: string; severity: string; message: string; created_at: string
}

interface Props {
  doctorId: string
  doctorName: string
  pregnancies: Pregnancy[]
  children: Child[]
  initialFlags: Flag[]
  initialLastCheckins: Record<string, string>
}

type Row = {
  subjectType: "pregnancy" | "child"
  subjectId: string
  motherName: string
  stage: string
  lastCheckin: string | null
  topFlag: Flag | null
  severity: "red" | "yellow" | "green" | null
}

function severityOrder(s: string | null) {
  if (s === "red") return 0
  if (s === "yellow") return 1
  if (s === "green") return 2
  return 3
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function DoctorDashboardClient({
  doctorId, doctorName, pregnancies, children, initialFlags, initialLastCheckins
}: Props) {
  const router = useRouter()
  const [flags, setFlags] = useState<Flag[]>(initialFlags)
  const [lastCheckins, setLastCheckins] = useState(initialLastCheckins)
  const [realtimePulse, setRealtimePulse] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const allSubjectIds = [
      ...pregnancies.map(p => p.id),
      ...children.map(c => c.id),
    ]

    // Realtime: watch flags table for new rows on linked subjects
    const flagSub = supabase
      .channel("doctor-flags")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "flags" },
        (payload) => {
          const newFlag = payload.new as Flag
          if (allSubjectIds.includes(newFlag.subject_id)) {
            setFlags(prev => [newFlag, ...prev])
            setRealtimePulse(true)
            setTimeout(() => setRealtimePulse(false), 2000)
          }
        }
      )
      .subscribe()

    // Realtime: watch checkins table for new rows
    const checkinSub = supabase
      .channel("doctor-checkins")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        (payload) => {
          const c = payload.new as { subject_id: string; created_at: string }
          if (allSubjectIds.includes(c.subject_id)) {
            setLastCheckins(prev => ({ ...prev, [c.subject_id]: c.created_at }))
            setRealtimePulse(true)
            setTimeout(() => setRealtimePulse(false), 2000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(flagSub)
      supabase.removeChannel(checkinSub)
    }
  }, [pregnancies, children])

  const flagsBySubject = flags.reduce((acc, f) => {
    if (!acc[f.subject_id]) acc[f.subject_id] = []
    acc[f.subject_id].push(f)
    return acc
  }, {} as Record<string, Flag[]>)

  const getTopFlag = (subjectId: string): { flag: Flag | null; severity: "red" | "yellow" | "green" | null } => {
    const fs = flagsBySubject[subjectId] || []
    const red = fs.find(f => f.severity === "red")
    if (red) return { flag: red, severity: "red" }
    const yellow = fs.find(f => f.severity === "yellow")
    if (yellow) return { flag: yellow, severity: "yellow" }
    return { flag: null, severity: null }
  }

  // Build rows
  const rows: Row[] = [
    ...pregnancies.map(p => {
      const { flag, severity } = getTopFlag(p.id)
      return {
        subjectType: "pregnancy" as const,
        subjectId: p.id,
        motherName: p.profiles?.full_name || "Unknown",
        stage: formatStage("pregnancy", { due_date: p.due_date }),
        lastCheckin: lastCheckins[p.id] || null,
        topFlag: flag,
        severity,
      }
    }),
    ...children.map(c => {
      const { flag, severity } = getTopFlag(c.id)
      return {
        subjectType: "child" as const,
        subjectId: c.id,
        motherName: c.profiles?.full_name || "Unknown",
        stage: formatStage("child", { birth_date: c.birth_date, name: c.name }),
        lastCheckin: lastCheckins[c.id] || null,
        topFlag: flag,
        severity,
      }
    }),
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <header className="bg-white border-b border-[var(--border)] px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Patient Dashboard</h1>
          <p className="text-xs text-[var(--muted-foreground)]">{doctorName}</p>
        </div>
        <div className="flex items-center gap-2">
          {realtimePulse && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" /> Live update
            </span>
          )}
          <Link href="/doctor/settings">
            <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--foreground)]">
            {rows.length} patient{rows.length !== 1 ? "s" : ""} linked
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Realtime
          </div>
        </div>

        {rows.length === 0 && (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-4xl mb-3">👩‍⚕️</p>
            <p className="font-medium">No patients linked yet</p>
            <p className="text-sm mt-1">Share your invite code from Settings so mothers can link to you.</p>
            <Link href="/doctor/settings" className="mt-4 inline-block">
              <Button variant="secondary">Go to Settings</Button>
            </Link>
          </div>
        )}

        <div className="space-y-2">
          {rows.map(row => (
            <Link
              key={row.subjectId}
              href={`/doctor/patient/${row.subjectType}/${row.subjectId}`}
              className="block"
            >
              <div className={`bg-white rounded-2xl border-2 p-4 flex items-center gap-4 hover:border-[var(--primary)] transition-colors ${
                row.severity === "red" ? "border-red-200 bg-red-50/30" :
                row.severity === "yellow" ? "border-yellow-200 bg-yellow-50/30" :
                "border-[var(--border)]"
              }`}>
                {/* Severity dot */}
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  row.severity === "red" ? "bg-[#DC2626]" :
                  row.severity === "yellow" ? "bg-[#F59E0B]" :
                  "bg-[#10B981]"
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{row.motherName}</span>
                    <span className="text-xs bg-[var(--muted)] px-2 py-0.5 rounded-full text-[var(--muted-foreground)]">
                      {row.subjectType === "pregnancy" ? "🤰" : "🍼"} {row.stage}
                    </span>
                  </div>
                  {row.topFlag && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                      ⚑ {row.topFlag.message}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {row.lastCheckin ? timeAgo(row.lastCheckin) : "No check-ins"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
