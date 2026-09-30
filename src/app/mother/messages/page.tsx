import { redirect } from "next/navigation"
import Link from "next/link"
import { Stethoscope } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { AppHeader } from "@/components/app/app-header"
import { Button } from "@/components/ui/button"

export default async function MotherMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Find linked doctor from pregnancies or children
  const [{ data: pregnancies }, { data: children }] = await Promise.all([
    supabase.from("pregnancies").select("linked_doctor_id").eq("mother_id", user.id).not("linked_doctor_id", "is", null).limit(1),
    supabase.from("children").select("linked_doctor_id").eq("mother_id", user.id).not("linked_doctor_id", "is", null).limit(1),
  ])

  const doctorId = pregnancies?.[0]?.linked_doctor_id || children?.[0]?.linked_doctor_id || null

  let doctorName = "Your Doctor"
  if (doctorId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", doctorId)
      .maybeSingle()
    if (profile?.full_name) {
      doctorName = profile.full_name
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col pb-[64px] md:pb-0">
      <AppHeader role="mother" />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6">
        <div className="mb-4 shrink-0">
          <h1 className="text-2xl font-semibold text-white">Messages</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Talk directly with your doctor between visits.</p>
        </div>

        {!doctorId ? (
          <div className="surface flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Stethoscope className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-white">No doctor linked yet</h2>
            <p className="mt-1.5 max-w-sm text-sm text-[var(--muted-foreground)]">
              Link your doctor with their referral code from your dashboard to start messaging.
            </p>
            <Link href="/mother/home" className="mt-6">
              <Button>Go to dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="min-h-0 flex-1">
            <ChatWindow
              currentUserId={user.id}
              partnerId={doctorId}
              partnerName={doctorName}
              partnerRole="doctor"
            />
          </div>
        )}
      </main>
    </div>
  )
}
