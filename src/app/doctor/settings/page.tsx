import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { bootstrapAccount } from "@/lib/account"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { ReferralCodeManager } from "./referral-code-manager"

export default async function DoctorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await bootstrapAccount(supabase, user)

  const [{ data: doctor }, { data: profile }] = await Promise.all([
    supabase
      .from("doctors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  if (!doctor) redirect("/doctor/dashboard")

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-[var(--border)] bg-[rgba(8,17,31,0.72)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <Link href="/doctor/dashboard" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-white">Doctor settings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 rounded-[1.8rem] border border-[rgba(125,211,252,0.18)] bg-[rgba(8,17,31,0.76)] p-6 backdrop-blur">
          <h2 className="text-3xl font-semibold text-white">{profile?.full_name || "Doctor"}</h2>
          {doctor.specialty && <p className="mt-2 text-sm text-[var(--muted-foreground)]">{doctor.specialty}</p>}
          {doctor.clinic_name && <p className="text-sm text-[var(--muted-foreground)]">{doctor.clinic_name}</p>}
          <p className="mt-4 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Generate a special referral code with a name you can remember. Mothers can enter it during onboarding or from their dashboard to connect their check-ins to you.
          </p>
        </div>

        <ReferralCodeManager
          userId={user.id}
          displayName={profile?.full_name || "Doctor"}
          currentCode={doctor.invite_code}
          specialty={doctor.specialty}
          clinicName={doctor.clinic_name}
        />
      </div>

      <MedicalFooter />
    </div>
  )
}
