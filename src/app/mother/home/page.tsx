import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MotherHomeClient } from "./client"

export default async function MotherHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Archive babies over 24 months lazily on page load
  await supabase
    .from("children")
    .update({ archived_at: new Date().toISOString() })
    .eq("mother_id", user.id)
    .is("archived_at", null)
    .lt("birth_date", new Date(Date.now() - 730 * 86400000).toISOString().split("T")[0])

  const [{ data: pregnancies }, { data: children }, { data: appointments }, { data: flags }] =
    await Promise.all([
      supabase
        .from("pregnancies")
        .select("*")
        .eq("mother_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("children")
        .select("*")
        .eq("mother_id", user.id)
        .is("archived_at", null)
        .order("birth_date", { ascending: false }),
      supabase
        .from("appointments")
        .select("*")
        .eq("mother_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3),
      supabase
        .from("flags")
        .select("*")
        .eq("mother_id", user.id)
        .is("resolved_at", null),
    ])

  // Get last check-in times per subject
  const subjectIds = [
    ...(pregnancies || []).map(p => p.id),
    ...(children || []).map(c => c.id),
  ]

  let lastCheckins: Record<string, string> = {}
  if (subjectIds.length > 0) {
    const { data: checkins } = await supabase
      .from("checkins")
      .select("subject_id, created_at")
      .in("subject_id", subjectIds)
      .order("created_at", { ascending: false })
    if (checkins) {
      for (const c of checkins) {
        if (!lastCheckins[c.subject_id]) lastCheckins[c.subject_id] = c.created_at
      }
    }
  }

  return (
    <MotherHomeClient
      pregnancies={pregnancies || []}
      children={children || []}
      appointments={appointments || []}
      flags={flags || []}
      lastCheckins={lastCheckins}
    />
  )
}
