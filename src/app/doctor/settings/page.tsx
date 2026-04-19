import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CopyCodeButton } from "./copy-button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"

export default async function DoctorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: doctor } = await supabase
    .from("doctors")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!doctor) redirect("/doctor/dashboard")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      <header className="bg-white border-b border-[var(--border)] px-4 py-4 flex items-center gap-3">
        <Link href="/doctor/dashboard" className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-[var(--foreground)]">Settings</h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Profile */}
        <div>
          <h2 className="font-bold text-[var(--foreground)] mb-1">{profile?.full_name || "Doctor"}</h2>
          {doctor.specialty && <p className="text-sm text-[var(--muted-foreground)]">{doctor.specialty}</p>}
          {doctor.clinic_name && <p className="text-sm text-[var(--muted-foreground)]">{doctor.clinic_name}</p>}
        </div>

        {/* Invite code */}
        <div className="bg-white rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
          <div>
            <h3 className="font-bold text-[var(--foreground)]">Your invite code</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Share this code with your patients so they can link to you.
            </p>
          </div>

          <div className="bg-[var(--muted)] rounded-xl p-5 text-center">
            <span className="text-4xl font-bold tracking-[0.2em] text-[var(--primary)]">
              {doctor.invite_code}
            </span>
          </div>

          <CopyCodeButton code={doctor.invite_code} />
        </div>

        <div className="text-xs text-[var(--muted-foreground)] text-center">
          Patients enter this code during sign-up or from their home screen.
        </div>
      </div>

      <MedicalFooter />
    </div>
  )
}
