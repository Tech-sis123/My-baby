import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatStage, SEVERITY_COLORS } from "@/lib/utils"
import { MedicalFooter } from "@/components/medical-footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PrintButton } from "./print-button"

export default async function PreVisitBriefPage({
  params,
}: {
  params: Promise<{ subjectType: string; subjectId: string }>
}) {
  const { subjectType, subjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let subject: Record<string, unknown> | null = null
  if (subjectType === "pregnancy") {
    const { data } = await supabase.from("pregnancies").select("*").eq("id", subjectId).single()
    subject = data
  } else {
    const { data } = await supabase.from("children").select("*").eq("id", subjectId).single()
    subject = data
  }
  if (!subject) redirect("/mother/home")

  const stage = subjectType === "pregnancy"
    ? formatStage("pregnancy", { due_date: (subject?.due_date as string) || "" })
    : formatStage("child", { birth_date: (subject?.birth_date as string) || "", name: (subject?.name as string) || "Baby" })

  // Last 7 days of check-ins
  const sevenDaysAgoDate = new Date()
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7)
  const sevenDaysAgo = sevenDaysAgoDate.toISOString()
  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("subject_id", subjectId)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })

  // Active flags
  const { data: flags } = await supabase
    .from("flags")
    .select("*")
    .eq("subject_id", subjectId)
    .is("resolved_at", null)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-white pb-24 print:pb-0">
      <header className="border-b border-gray-200 px-4 py-4 flex items-center gap-3 print:hidden">
        <Link href="/mother/home" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="font-bold">Pre-visit brief</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Show this to your doctor at your appointment</p>
        </div>
        <PrintButton />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="text-sm text-gray-500 mb-1">My Baby app — Pre-visit brief</div>
          <h2 className="text-2xl font-bold">{stage}</h2>
          <p className="text-sm text-gray-500">
            Generated {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Active flags */}
        {(flags || []).length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3">Active alerts</h3>
            <div className="space-y-2">
              {(flags || []).map(f => (
                <div key={f.id} className={`px-4 py-3 rounded-xl border text-sm ${SEVERITY_COLORS[f.severity]}`}>
                  <span className="font-semibold capitalize">{f.severity}:</span> {f.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last 7 days check-ins */}
        <div>
          <h3 className="font-bold text-lg mb-3">Last 7 days check-ins ({(checkins || []).length})</h3>
          {(checkins || []).length === 0 && (
            <p className="text-gray-500 text-sm">No check-ins in the last 7 days.</p>
          )}
          <div className="space-y-3">
            {(checkins || []).map(c => {
              const payload = c.payload as Record<string, unknown>
              return (
                <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold mb-2 text-gray-600">
                    {new Date(c.created_at).toLocaleDateString("en-NG", {
                      weekday: "long", day: "numeric", month: "short"
                    })}
                  </p>
                  <div className="text-sm space-y-1 text-gray-700">
                    {payload.feeling != null && <p>Feeling: <strong className="capitalize">{String(payload.feeling).replace("_", " ")}</strong></p>}
                    {payload.mother_mood != null && <p>Mood: <strong className="capitalize">{String(payload.mother_mood).replace("_", " ")}</strong></p>}
                    {payload.feeding != null && <p>Feeding: <strong className="capitalize">{String(payload.feeding)}</strong></p>}
                    {payload.wet_diapers_24h !== undefined && <p>Wet diapers (24h): <strong>{String(payload.wet_diapers_24h)}</strong></p>}
                    {payload.bp_systolic != null && <p>BP: <strong>{String(payload.bp_systolic)}/{String(payload.bp_diastolic || "?")} mmHg</strong></p>}
                    {payload.fever === true && <p>Fever: <strong>Yes {payload.temp != null ? `(${String(payload.temp)}°C)` : ""}</strong></p>}
                    {payload.bleeding === true && <p className="text-red-600 font-semibold">Bleeding: Yes</p>}
                    {payload.severe_headache === true && <p className="text-red-600 font-semibold">Severe headache: Yes</p>}
                    {payload.swelling === true && <p className="text-red-600 font-semibold">Swelling: Yes</p>}
                    {payload.note != null && <p className="italic text-gray-500 mt-1">Note: &ldquo;{String(payload.note)}&rdquo;</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="text-xs text-gray-400 border-t pt-4">
          Generated by My Baby app. For general information only — not a medical record.
        </div>
      </div>

      <MedicalFooter />
    </div>
  )
}
