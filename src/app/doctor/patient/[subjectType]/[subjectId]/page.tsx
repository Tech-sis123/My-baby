import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatStage, SEVERITY_COLORS } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MedicalFooter } from "@/components/medical-footer"
import { ScheduleCallbackForm } from "./callback-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function DoctorPatientPage({
  params,
}: {
  params: Promise<{ subjectType: string; subjectId: string }>
}) {
  const { subjectType, subjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get subject info
  let subjectRow: { mother_id: string; [k: string]: unknown } | null = null
  if (subjectType === "pregnancy") {
    const { data } = await supabase.from("pregnancies").select("*").eq("id", subjectId).single()
    subjectRow = data
  } else {
    const { data } = await supabase.from("children").select("*").eq("id", subjectId).single()
    subjectRow = data
  }
  if (!subjectRow) redirect("/doctor/dashboard")

  const motherId = subjectRow.mother_id as string

  // Mother profile
  const { data: mother } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", motherId)
    .single()

  // Last 30 check-ins with flags
  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(30)

  const checkinIds = (checkins || []).map(c => c.id)
  let flagsByCheckin: Record<string, Array<{ severity: string; message: string; rule_id: string }>> = {}
  if (checkinIds.length > 0) {
    const { data: allFlags } = await supabase
      .from("flags")
      .select("*")
      .in("checkin_id", checkinIds)
    for (const f of allFlags || []) {
      if (!flagsByCheckin[f.checkin_id]) flagsByCheckin[f.checkin_id] = []
      flagsByCheckin[f.checkin_id].push(f)
    }
  }

  const stage = subjectType === "pregnancy"
    ? formatStage("pregnancy", { due_date: subjectRow.due_date as string })
    : formatStage("child", { birth_date: subjectRow.birth_date as string, name: subjectRow.name as string })

  return (
    <div className="min-h-screen bg-[var(--muted)] pb-20">
      <header className="bg-white border-b border-[var(--border)] px-4 py-4 flex items-center gap-3">
        <Link href="/doctor/dashboard" className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-[var(--foreground)]">{mother?.full_name || "Patient"}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {subjectType === "pregnancy" ? "🤰" : "🍼"} {stage}
            {mother?.phone && ` · ${mother.phone}`}
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Schedule callback */}
        <ScheduleCallbackForm
          motherId={motherId}
          doctorId={user.id}
          subjectType={subjectType}
          subjectId={subjectId}
        />

        {/* Check-in timeline */}
        <div>
          <h2 className="font-bold text-[var(--foreground)] mb-3">Check-in history</h2>
          {(checkins || []).length === 0 && (
            <p className="text-[var(--muted-foreground)] text-sm">No check-ins yet.</p>
          )}
          <div className="space-y-3">
            {(checkins || []).map(c => {
              const flags = flagsByCheckin[c.id] || []
              const topSeverity = flags.find(f => f.severity === "red")?.severity
                || flags.find(f => f.severity === "yellow")?.severity
                || null
              const payload = c.payload as Record<string, unknown>

              return (
                <Card key={c.id} className={`${
                  topSeverity === "red" ? "border-red-300 bg-red-50/50" :
                  topSeverity === "yellow" ? "border-yellow-300 bg-yellow-50/50" :
                  ""
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {new Date(c.created_at).toLocaleDateString("en-NG", {
                          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                      {topSeverity && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_COLORS[topSeverity]}`}>
                          {topSeverity.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Render flags */}
                    {flags.map(f => (
                      <div key={f.rule_id} className={`text-xs px-3 py-2 rounded-xl border mb-2 ${SEVERITY_COLORS[f.severity]}`}>
                        {f.message}
                      </div>
                    ))}

                    {/* Key payload fields */}
                    <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                      {payload.feeling && <p>Feeling: <span className="font-medium capitalize">{String(payload.feeling).replace("_", " ")}</span></p>}
                      {payload.mother_mood && <p>Mother mood: <span className="font-medium capitalize">{String(payload.mother_mood).replace("_", " ")}</span></p>}
                      {payload.wet_diapers_24h !== undefined && <p>Wet diapers: <span className="font-medium">{String(payload.wet_diapers_24h)}</span></p>}
                      {payload.bp_systolic && <p>BP: <span className="font-medium">{String(payload.bp_systolic)}/{String(payload.bp_diastolic || "?")} mmHg</span></p>}
                      {payload.note && <p className="italic mt-1">"{String(payload.note)}"</p>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      <MedicalFooter />
    </div>
  )
}
