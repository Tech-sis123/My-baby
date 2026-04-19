import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { bootstrapAccount } from "@/lib/account"
import { AskAIClient } from "./client"

export const metadata = {
  title: "Health Assistant - My Baby",
  description: "Ask the AI health assistant about pregnancy and baby care",
}

export default async function AskAIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await bootstrapAccount(supabase, user)

  // Verify this is a mother account
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "mother") {
    redirect("/mother/home")
  }

  return (
    <AskAIClient
      role="mother"
      homeHref="/mother/home"
      title="Mother AI assistant"
      subtitle="Pregnancy and baby support"
      intro="I’m ready to help with pregnancy questions, baby-care routines, check-ins, and what to watch next. Tell me what is happening."
      placeholder="Ask about pregnancy, feeding, diapers, sleep, or baby care…"
    />
  )
}
