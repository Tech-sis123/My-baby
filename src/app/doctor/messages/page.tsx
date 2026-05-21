import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, User, MessageSquare } from "lucide-react"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Message, Flag } from "@/lib/supabase/types"

function timeAgoShort(iso: string): string {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return "Yesterday"
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })
  }
}

export default async function DoctorMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  // Fetch mothers linked to this doctor using admin client to bypass RLS
  const adminClient = await createAdminClient()
  const [pregnanciesRes, childrenRes] = await Promise.all([
    adminClient.from("pregnancies").select("mother_id, profiles!pregnancies_mother_id_fkey(full_name), id").eq("linked_doctor_id", user.id),
    adminClient.from("children").select("mother_id, profiles!children_mother_id_fkey(full_name), id").eq("linked_doctor_id", user.id),
  ])
  
  if (pregnanciesRes.error) console.error("Pregnancies fetch error:", pregnanciesRes.error)
  if (childrenRes.error) console.error("Children fetch error:", childrenRes.error)
  
  const pregnancies = pregnanciesRes.data
  const children = childrenRes.data

  const patientsMap = new Map<string, { name: string, subjectIds: string[] }>()
  
  const addPatient = (motherId: string, name: string, subjectId: string) => {
    if (!patientsMap.has(motherId)) {
      patientsMap.set(motherId, { name, subjectIds: [] })
    }
    patientsMap.get(motherId)!.subjectIds.push(subjectId)
  }

  pregnancies?.forEach((p) => {
    if (p.mother_id && p.profiles && typeof p.profiles === 'object' && 'full_name' in p.profiles && p.profiles.full_name) {
      addPatient(p.mother_id, p.profiles.full_name as string, p.id)
    }
  })

  children?.forEach((c) => {
    if (c.mother_id && c.profiles && typeof c.profiles === 'object' && 'full_name' in c.profiles && c.profiles.full_name) {
      addPatient(c.mother_id, c.profiles.full_name as string, c.id)
    }
  })

  const allSubjectIds = Array.from(patientsMap.values()).flatMap(p => p.subjectIds)

  // Fetch latest messages and unresolved flags
  const [{ data: messages }, { data: flags }] = await Promise.all([
    adminClient
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
    adminClient
      .from('flags')
      .select('*')
      .in('subject_id', allSubjectIds)
      .is('resolved_at', null)
  ])

  // Process data for UI
  const patientsList = Array.from(patientsMap.entries()).map(([id, info]) => {
    // Find latest message for this patient
    const latestMessage = (messages as Message[] | null)?.find(m => m.sender_id === id || m.receiver_id === id)
    
    // Determine status from flags
    const patientFlags = (flags as Flag[] | null)?.filter(f => info.subjectIds.includes(f.subject_id)) || []
    let status: "red" | "yellow" | "green" = "green"
    if (patientFlags.some(f => f.severity === "red")) {
      status = "red"
    } else if (patientFlags.some(f => f.severity === "yellow")) {
      status = "yellow"
    }

    return {
      id,
      name: info.name,
      latestMessage,
      status,
      timestamp: latestMessage ? new Date(latestMessage.created_at).getTime() : 0
    }
  }).sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent message

  const getStatusColor = (status: "red" | "yellow" | "green") => {
    if (status === "red") return "bg-red-500 border-red-500"
    if (status === "yellow") return "bg-yellow-500 border-yellow-500"
    return "bg-emerald-500 border-emerald-500"
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <Link href="/doctor/dashboard" className="text-white hover:text-gray-300 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <p className="font-display text-2xl font-semibold text-white">Messages</p>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Patient Communications</p>
          </div>
        </div>
      </header>
      
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <MessageSquare className="h-5 w-5 text-[var(--primary)]" /> Select a Patient
            </h2>
            <p className="text-sm text-gray-500 mt-1">Chat directly with mothers under your care.</p>
          </div>
          
          {patientsList.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No patients linked to your account yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {patientsList.map((patient) => {
                const isUnread = patient.latestMessage && patient.latestMessage.sender_id === patient.id // We don't have true read receipts, but we can assume sent by them is potentially unread.
                
                return (
                  <li key={patient.id} className="group">
                    <Link 
                      href={`/doctor/messages/${patient.id}`} 
                      className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[rgba(199,143,98,0.1)] text-[var(--primary)] font-semibold text-lg">
                          {patient.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        {/* Status Indicator */}
                        <div 
                          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${getStatusColor(patient.status)}`} 
                          title={`Status: ${patient.status}`}
                        />
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`truncate font-semibold ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                            {patient.name}
                          </p>
                          <span className={`text-xs flex-shrink-0 ml-2 ${isUnread ? "text-[var(--primary)] font-medium" : "text-gray-400"}`}>
                            {patient.latestMessage ? timeAgoShort(patient.latestMessage.created_at) : ""}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4">
                          <p className={`text-sm truncate ${isUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                            {patient.latestMessage ? (
                              <>
                                {patient.latestMessage.sender_id === user.id && "You: "}
                                {patient.latestMessage.content}
                              </>
                            ) : (
                              <span className="italic text-gray-400">No messages yet. Tap to start chatting.</span>
                            )}
                          </p>
                          {/* Chevron */}
                          <ChevronLeft className="h-5 w-5 text-gray-300 rotate-180 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
