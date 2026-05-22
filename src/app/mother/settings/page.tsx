import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, User } from "lucide-react"
import { MedicalFooter } from "@/components/medical-footer"
import { bootstrapAccount } from "@/lib/account"
import { createClient } from "@/lib/supabase/server"
import { ProfileSettings } from "@/components/profile-settings"

export default async function MotherSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  await bootstrapAccount(supabase, user)

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile || profile.role !== "mother") redirect("/doctor/dashboard")

  const displayName = profile?.full_name || "Mother"

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-black/40 px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/mother/home"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--primary)]">Mother Settings</p>
              <h1 className="text-base font-semibold text-white">{displayName}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <ProfileSettings 
          userId={user.id} 
          initialFullName={profile?.full_name || ""} 
          initialPhone={profile?.phone || ""} 
          email={user.email || ""} 
        />
      </div>

      <MedicalFooter />
    </div>
  )
}
