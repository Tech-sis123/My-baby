import { redirect } from "next/navigation"
import { MedicalFooter } from "@/components/medical-footer"
import { AppHeader } from "@/components/app/app-header"
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
    <div className="min-h-screen pb-24 md:pb-0">
      <AppHeader role="mother" userName={displayName} userMeta={user.email || undefined} />

      <main className="motion-rise mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Manage your personal details and contact information.</p>

        <div className="mt-6">
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
