import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { bootstrapAccount } from "@/lib/account"
import { AskAIClient } from "@/app/mother/ask/client"

export const metadata = {
  title: "Doctor AI Assistant - My Baby",
  description: "Ask the AI assistant from the doctor dashboard",
}

export default async function DoctorAskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await bootstrapAccount(supabase, user)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "doctor") redirect("/mother/home")

  return (
    <AskAIClient
      role="doctor"
      homeHref="/doctor/dashboard"
      title="Doctor AI assistant"
      subtitle="Clinical brainstorming support"
      intro="You can ask from a doctor’s perspective. Share the patient context, what you are seeing, and what kind of next-step support you want."
      placeholder="Describe the patient context or ask for triage guidance…"
    />
  )
}
