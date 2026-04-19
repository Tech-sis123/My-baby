import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { bootstrapAccount } from "@/lib/account"
import { DoctorDashboardClient } from "./client"

export default async function DoctorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await bootstrapAccount(supabase, user)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "doctor") redirect("/mother/home")

  const [{ data: doctor }, { data: pregnancies }, { data: babyProfiles }] = await Promise.all([
    supabase
      .from("doctors")
      .select("invite_code, specialty, clinic_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("pregnancies")
      .select("*, profiles!pregnancies_mother_id_fkey(full_name)")
      .eq("linked_doctor_id", user.id)
      .eq("status", "active"),
    supabase
      .from("children")
      .select("*, profiles!children_mother_id_fkey(full_name)")
      .eq("linked_doctor_id", user.id)
      .is("archived_at", null),
  ])

  const subjectIds = [
    ...(pregnancies || []).map(pregnancy => pregnancy.id),
    ...(babyProfiles || []).map(child => child.id),
  ]

  let flags: Array<{
    id: string
    mother_id: string
    subject_id: string
    subject_type: string
    rule_id: string
    severity: string
    message: string
    created_at: string
  }> = []

  const lastCheckins: Record<string, string> = {}

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
    for (const checkin of checkinsRes.data || []) {
      if (!lastCheckins[checkin.subject_id]) lastCheckins[checkin.subject_id] = checkin.created_at
    }
  }

  return (
    <DoctorDashboardClient
      doctorId={user.id}
      doctorName={profile?.full_name || "Doctor"}
      specialty={doctor?.specialty || null}
      clinicName={doctor?.clinic_name || null}
      inviteCode={doctor?.invite_code || null}
      pregnancies={pregnancies || []}
      babyProfiles={babyProfiles || []}
      initialFlags={flags}
      initialLastCheckins={lastCheckins}
    />
  )
}
