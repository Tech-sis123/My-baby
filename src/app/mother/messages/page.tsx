import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { MedicalFooter } from "@/components/medical-footer"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

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
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/mother/home" className="text-white hover:text-gray-300 transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <p className="font-display text-2xl font-semibold text-white">Direct Messages</p>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Doctor Consultation</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center">
        {!doctorId ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">No Doctor Linked</h2>
            <p className="text-gray-500 mb-6">You need to link a doctor to your pregnancy or baby profile to start messaging.</p>
            <Link href="/mother/home" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Return Home
            </Link>
          </div>
        ) : (
          <ChatWindow 
            currentUserId={user.id} 
            partnerId={doctorId} 
            partnerName={doctorName} 
            partnerRole="doctor" 
          />
        )}
      </main>
      
      <MedicalFooter />
    </div>
  )
}
