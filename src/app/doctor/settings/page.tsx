import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowLeft,
  Baby,
  Link2,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { bootstrapAccount } from "@/lib/account"
import { createClient } from "@/lib/supabase/server"
import { ReferralCodeManager } from "./referral-code-manager"

export default async function DoctorSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  await bootstrapAccount(supabase, user)

  const [{ data: doctor }, { data: profile }, { data: pregnancies }, { data: children }] = await Promise.all([
    supabase.from("doctors").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("pregnancies").select("id, mother_id").eq("linked_doctor_id", user.id),
    supabase.from("children").select("id, mother_id").eq("linked_doctor_id", user.id),
  ])

  if (!doctor) redirect("/doctor/dashboard")

  const linkedMotherCount = new Set([...(pregnancies || []).map(item => item.mother_id), ...(children || []).map(item => item.mother_id)]).size
  const pregnancyCount = pregnancies?.length || 0
  const babyCount = children?.length || 0
  const displayName = profile?.full_name || "Doctor"

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(43,37,31,0.88)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">Doctor settings</p>
              <h1 className="text-base font-semibold text-white">{displayName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]">
            <ShieldCheck className="h-3.5 w-3.5" /> Linkage active
          </div>
        </div>
      </header>

      {/* Stat strip */}
      <div className="border-b border-[var(--border)] bg-[rgba(73,60,51,0.5)]">
        <div className="mx-auto flex w-full max-w-3xl divide-x divide-[var(--border)]">
          {[
            { label: "Linked mothers", value: linkedMotherCount, icon: <Users className="h-3.5 w-3.5" /> },
            { label: "Pregnancies", value: pregnancyCount, icon: <Stethoscope className="h-3.5 w-3.5" /> },
            { label: "Baby tracks", value: babyCount, icon: <Baby className="h-3.5 w-3.5" /> },
            { label: "Current code", value: doctor.invite_code, icon: <Link2 className="h-3.5 w-3.5 text-emerald-100" /> },
          ].map(stat => (
            <div key={stat.label} className="flex-1 px-4 py-3">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                {stat.icon} {stat.label}
              </div>
              <p className="mt-0.5 text-lg font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral code manager */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <ReferralCodeManager
          userId={user.id}
          displayName={displayName}
          currentCode={doctor.invite_code}
          specialty={doctor.specialty}
          clinicName={doctor.clinic_name}
        />
      </div>

      <MedicalFooter />
    </div>
  )
}
