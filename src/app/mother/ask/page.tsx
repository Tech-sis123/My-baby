import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AskAIClient } from "./client"

export const metadata = {
  title: "Health Assistant - My Baby",
  description: "Ask the AI health assistant about pregnancy and baby care",
}

export default async function AskAIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify this is a mother account
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "mother") {
    redirect("/mother/home")
  }

  return <AskAIClient />
}
