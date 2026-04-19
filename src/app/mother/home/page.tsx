import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { bootstrapAccount } from "@/lib/account"
import { MotherHomeClient } from "./client"

export default async function MotherHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const account = await bootstrapAccount(supabase, user)
  if (account.role === "doctor") redirect("/doctor/dashboard")
  const archiveBefore = new Date()
  archiveBefore.setDate(archiveBefore.getDate() - 730)

  await supabase
    .from("children")
    .update({ archived_at: new Date().toISOString() })
    .eq("mother_id", user.id)
    .is("archived_at", null)
    .lt("birth_date", archiveBefore.toISOString().split("T")[0])

  const [{ data: pregnancies }, { data: babyProfiles }, { data: appointments }, { data: flags }, { data: profile }] =
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
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle(),
    ])

  const subjectIds = [
    ...(pregnancies || []).map(pregnancy => pregnancy.id),
    ...(babyProfiles || []).map(child => child.id),
  ]

  const lastCheckins: Record<string, string> = {}
  if (subjectIds.length > 0) {
    const { data: checkins } = await supabase
      .from("checkins")
      .select("subject_id, created_at")
      .in("subject_id", subjectIds)
      .order("created_at", { ascending: false })

    for (const checkin of checkins || []) {
      if (!lastCheckins[checkin.subject_id]) lastCheckins[checkin.subject_id] = checkin.created_at
    }
  }

  return (
    <MotherHomeClient
      profileName={profile?.full_name || "Mama"}
      email={user.email || ""}
      pregnancies={pregnancies || []}
      babyProfiles={babyProfiles || []}
      appointments={appointments || []}
      flags={flags || []}
      lastCheckins={lastCheckins}
    />
  )
}
