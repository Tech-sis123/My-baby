import { redirect } from "next/navigation"
import { Baby, HeartPulse, Users } from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { AppHeader } from "@/components/app/app-header"
import { StatTile } from "@/components/app/status"
import { bootstrapAccount } from "@/lib/account"
import { createClient } from "@/lib/supabase/server"
import { ReferralCodeManager } from "./referral-code-manager"
import { ProfileSettings } from "@/components/profile-settings"

export default async function DoctorSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  await bootstrapAccount(supabase, user)

  const [{ data: doctor }, { data: profile }, { data: pregnancies }, { data: children }] = await Promise.all([
    supabase.from("doctors").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("pregnancies").select("id, mother_id").eq("linked_doctor_id", user.id),
    supabase.from("children").select("id, mother_id").eq("linked_doctor_id", user.id),
  ])

  if (!doctor) redirect("/doctor/dashboard")

  const linkedMotherCount = new Set([...(pregnancies || []).map(item => item.mother_id), ...(children || []).map(item => item.mother_id)]).size
  const pregnancyCount = pregnancies?.length || 0
  const babyCount = children?.length || 0
  const displayName = profile?.full_name || "Doctor"

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <AppHeader role="doctor" userName={`Dr. ${displayName}`} userMeta={doctor.specialty || doctor.clinic_name || undefined} />

      <main className="motion-rise mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Your profile, referral code and linked patients.</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatTile label="Linked mothers" value={linkedMotherCount} icon={<Users className="h-4 w-4" />} />
          <StatTile label="Pregnancies" value={pregnancyCount} icon={<HeartPulse className="h-4 w-4" />} />
          <StatTile label="Baby tracks" value={babyCount} icon={<Baby className="h-4 w-4" />} />
        </div>

        <div className="mt-8 space-y-6">
          <ReferralCodeManager
            userId={user.id}
            displayName={displayName}
            currentCode={doctor.invite_code}
            specialty={doctor.specialty}
            clinicName={doctor.clinic_name}
          />
          <ProfileSettings
            userId={user.id}
            initialFullName={profile?.full_name || ""}
            initialPhone={profile?.phone || ""}
            email={user.email || ""}
          />
        </div>
      </main>

      <MedicalFooter />
    </div>
  )
}
