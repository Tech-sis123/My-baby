import { redirect } from "next/navigation"
import { bootstrapAccount } from "@/lib/account"
import { createClient } from "@/lib/supabase/server"
import { formatStage } from "@/lib/utils"
import { AskAIClient } from "@/app/mother/ask/client"

export const metadata = {
  title: "Doctor AI Assistant - My Baby",
  description: "Ask the AI assistant from the doctor dashboard",
}

type SearchParams = Promise<{
  subjectType?: string
  subjectId?: string
}>

type SubjectRow = {
  id: string
  mother_id: string
  linked_doctor_id: string | null
  due_date?: string | null
  birth_date?: string | null
  name?: string | null
}

export default async function DoctorAskPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const subjectType = params.subjectType === "pregnancy" || params.subjectType === "child" ? params.subjectType : null
  const subjectId = params.subjectId || null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await bootstrapAccount(supabase, user)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "doctor") redirect("/mother/home")

  let contextSummary: string | null = null
  let promptSuggestions: string[] | undefined
  let intro =
    "You can ask from a doctor’s perspective. Share the patient context, what you are seeing, and what kind of next-step support you want."

  if (subjectType && subjectId) {
    let subject: SubjectRow | null = null

    if (subjectType === "pregnancy") {
      const { data } = await supabase.from("pregnancies").select("*").eq("id", subjectId).eq("linked_doctor_id", user.id).maybeSingle()
      subject = data as SubjectRow | null
    } else {
      const { data } = await supabase.from("children").select("*").eq("id", subjectId).eq("linked_doctor_id", user.id).maybeSingle()
      subject = data as SubjectRow | null
    }

    if (subject) {
      const [{ data: mother }, { data: latestCheckin }, { data: latestFlags }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", subject.mother_id).maybeSingle(),
        supabase
          .from("checkins")
          .select("id, payload, created_at")
          .eq("subject_id", subject.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("flags")
          .select("message, severity")
          .eq("subject_id", subject.id)
          .is("resolved_at", null)
          .order("created_at", { ascending: false })
          .limit(2),
      ])

      const stage =
        subjectType === "pregnancy"
          ? formatStage("pregnancy", { due_date: subject.due_date || "" })
          : formatStage("child", { birth_date: subject.birth_date || "", name: subject.name || "Baby" })

      const payload = (latestCheckin?.payload || {}) as Record<string, unknown>
      const latestNote = typeof payload.note === "string" && payload.note.length > 0 ? payload.note : null
      const latestFlag = latestFlags?.[0]?.message || null
      const motherName = mother?.full_name || "Linked mother"
      const subjectLabel = subjectType === "pregnancy" ? "Pregnancy track" : "Baby track"

      contextSummary = [
        `${motherName}. ${subjectLabel}. ${stage}.`,
        latestFlag ? `Active alert: ${latestFlag}` : "No active unresolved alert is currently open.",
        latestCheckin?.created_at ? `Latest check-in: ${new Date(latestCheckin.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.` : "No recent check-in is available yet.",
        latestNote ? `Latest note: "${latestNote}"` : null,
      ]
        .filter(Boolean)
        .join(" ")

      intro = `You are looking at a live linked case. ${contextSummary} Ask for triage support, follow-up structure, or clinical questioning help based on this context.`

      if (subjectType === "pregnancy") {
        promptSuggestions = [
          `Using this case context, give me a short clinical synthesis, immediate priorities, and what I should ask next.`,
          `Using this pregnancy case, what warning signs matter most right now and how should I structure a callback?`,
          `Turn this pregnancy check-in context into: likely concern, follow-up questions, and escalation threshold.`,
        ]
      } else {
        promptSuggestions = [
          `Using this baby case context, give me a short clinical synthesis, immediate priorities, and what I should ask next.`,
          `Using this baby check-in, what are the most important hydration, fever, breathing, and maternal-support follow-up questions?`,
          `Turn this baby case into: likely concern, what to review now, and when escalation becomes necessary.`,
        ]
      }
    }
  }

  return (
    <AskAIClient
      role="doctor"
      homeHref="/doctor/dashboard"
      title="Doctor AI assistant"
      subtitle="Clinical brainstorming support"
      intro={intro}
      placeholder="Describe the patient context or ask for triage guidance…"
      contextSummary={contextSummary}
      promptSuggestions={promptSuggestions}
    />
  )
}
