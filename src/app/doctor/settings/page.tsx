import Link from "next/link"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import {
  ArrowLeft,
  Baby,
  Building2,
  Link2,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { bootstrapAccount } from "@/lib/account"
import { createClient } from "@/lib/supabase/server"
import { ReferralCodeManager } from "./referral-code-manager"

function MetricCard({
  label,
  value,
  note,
  accent,
  icon,
}: {
  label: string
  value: string | number
  note: string
  accent: string
  icon: ReactNode
}) {
  return (
    <div className={`rounded-[1.4rem] border p-4 ${accent}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em]">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{note}</p>
    </div>
  )
}

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
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/dashboard"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.08)] text-[var(--foreground)] transition hover:border-[rgba(201,139,88,0.34)] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Doctor settings</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">Referral code control center</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[rgba(199,143,98,0.24)] bg-[rgba(199,143,98,0.1)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--foreground)]">
            <ShieldCheck className="h-4 w-4" /> Linkage active
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <section className="panel-float overflow-hidden rounded-[2.25rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                <Link2 className="h-3.5 w-3.5" /> Invite-code linkage
              </div>

              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                One referral code should connect your whole care network without extra friction.
              </h2>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)]">
                <span>{displayName}</span>
                {doctor.specialty ? <span>· {doctor.specialty}</span> : null}
                {doctor.clinic_name ? <span>· {doctor.clinic_name}</span> : null}
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                Mothers should be able to enter one memorable code and immediately start sending pregnancy or baby check-ins into your board. This page controls that entry point and shows the reach of your current linkage.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Linked mothers"
                  value={linkedMotherCount}
                  note="Unique mothers currently connected to your care network."
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                  icon={<Users className="h-4 w-4 text-[var(--foreground)]" />}
                />
                <MetricCard
                  label="Pregnancy tracks"
                  value={pregnancyCount}
                  note="Pregnancy journeys feeding into your dashboard."
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                  icon={<Stethoscope className="h-4 w-4 text-[var(--foreground)]" />}
                />
                <MetricCard
                  label="Baby tracks"
                  value={babyCount}
                  note="Baby-care subjects already linked through invite-code flow."
                  accent="border-[var(--border)] bg-[rgba(255,248,239,0.08)]"
                  icon={<Baby className="h-4 w-4 text-[var(--foreground)]" />}
                />
                <MetricCard
                  label="Current code"
                  value={doctor.invite_code}
                  note="This is the code mothers can use right now."
                  accent="border-emerald-400/22 bg-emerald-500/8 text-emerald-100"
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-100" />}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
              <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <Building2 className="h-4 w-4" /> Referral logic
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Step 1</p>
                    <p className="mt-2 text-base font-semibold text-white">Choose a memorable doctor code</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      Your name, surname, clinic, or a short professional handle works best.
                    </p>
                  </div>

                  <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Step 2</p>
                    <p className="mt-2 text-base font-semibold text-white">Share it with mothers during onboarding</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      As soon as they enter it, their pregnancy and baby tracks can begin feeding your dashboard.
                    </p>
                  </div>

                  <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Step 3</p>
                    <p className="mt-2 text-base font-semibold text-white">Review triage and act from one place</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      The dashboard and patient detail screens will show red, yellow, and green priorities automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <ReferralCodeManager
            userId={user.id}
            displayName={displayName}
            currentCode={doctor.invite_code}
            specialty={doctor.specialty}
            clinicName={doctor.clinic_name}
          />
        </div>
      </div>

      <MedicalFooter />
    </div>
  )
}
