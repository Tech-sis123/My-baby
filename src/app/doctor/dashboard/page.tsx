import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DoctorDashboardClient } from "./client"

export default async function DoctorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify doctor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "doctor") redirect("/mother/home")

  // All linked pregnancies
  const { data: pregnancies } = await supabase
    .from("pregnancies")
    .select("*, profiles!pregnancies_mother_id_fkey(full_name)")
    .eq("linked_doctor_id", user.id)
    .eq("status", "active")

  // All linked children (not archived)
  const { data: children } = await supabase
    .from("children")
    .select("*, profiles!children_mother_id_fkey(full_name)")
    .eq("linked_doctor_id", user.id)
    .is("archived_at", null)

  // Collect all subject IDs
  const subjectIds = [
    ...(pregnancies || []).map(p => p.id),
    ...(children || []).map(c => c.id),
  ]

  // Active flags for all linked subjects
  let flags: Array<{
    id: string; mother_id: string; subject_id: string; subject_type: string;
    rule_id: string; severity: string; message: string; created_at: string
  }> = []

  let lastCheckins: Record<string, string> = {}

  if (subjectIds.length > 0) {
    const [flagsRes, checkinsRes] = await Promise.all([
      supabase
        .from("flags")
        .select("*")
        .in("subject_id", subjectIds)
        .is("resolved_at", null),
      supabase
        .from("checkins")
        .select("subject_id, created_at")
        .in("subject_id", subjectIds)
        .order("created_at", { ascending: false }),
    ])
    flags = flagsRes.data || []
    for (const c of checkinsRes.data || []) {
      if (!lastCheckins[c.subject_id]) lastCheckins[c.subject_id] = c.created_at
    }
  }

  return (
    <DoctorDashboardClient
      doctorId={user.id}
      doctorName={profile?.full_name || "Doctor"}
      pregnancies={pregnancies || []}
      children={children || []}
      initialFlags={flags}
      initialLastCheckins={lastCheckins}
    />
  )
}
