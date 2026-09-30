import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { SubHeader } from "@/components/app/sub-header"

interface PageProps {
  params: Promise<{
    patientId: string
  }>
}

export default async function DoctorChatPage({ params }: PageProps) {
  const resolvedParams = await params
  const { patientId } = resolvedParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Fetch patient profile to get the name
  const { data: patientProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", patientId)
    .maybeSingle()

  const patientName = patientProfile?.full_name || "Patient"

  return (
    <div className="flex h-[100dvh] flex-col">
      <SubHeader backHref="/doctor/messages" width="narrow" eyebrow="Direct message" title={patientName} />

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <ChatWindow
          currentUserId={user.id}
          partnerId={patientId}
          partnerName={patientName}
          partnerRole="mother"
        />
      </main>
    </div>
  )
}
