import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ChatWindow } from "@/components/chat/ChatWindow"

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
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <Link href="/doctor/messages" className="text-white hover:text-gray-300 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <p className="font-display text-2xl font-semibold text-white">Chat with {patientName}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Direct Message</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center">
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
