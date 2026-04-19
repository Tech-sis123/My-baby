import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppointmentsClient } from "./client"

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: appointments }, { data: pregnancies }, { data: babyProfiles }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("mother_id", user.id)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("pregnancies")
      .select("id, due_date, status")
      .eq("mother_id", user.id)
      .eq("status", "active"),
    supabase
      .from("children")
      .select("id, name, birth_date")
      .eq("mother_id", user.id)
      .is("archived_at", null),
  ])

  return (
    <AppointmentsClient
      motherId={user.id}
      appointments={appointments || []}
      pregnancies={pregnancies || []}
      babyProfiles={babyProfiles || []}
    />
  )
}
