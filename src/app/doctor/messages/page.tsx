import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight, User } from "lucide-react"
import { AppHeader } from "@/components/app/app-header"
import { EmptyState, SeverityDot } from "@/components/app/status"
import { cn } from "@/lib/utils"
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

  const unreadCount = patientsList.filter(p => p.latestMessage && p.latestMessage.sender_id === p.id).length

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <AppHeader role="doctor" />

      <main className="motion-rise mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-semibold text-white">Messages</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {patientsList.length} linked {patientsList.length === 1 ? "patient" : "patients"}
            {unreadCount > 0 ? ` · ${unreadCount} awaiting reply` : ""}
          </p>
        </div>

        <div className="surface mt-6 overflow-hidden">
          {patientsList.length === 0 ? (
            <EmptyState
              className="m-5 border-0"
              icon={<User className="h-5 w-5" />}
              title="No linked patients yet"
              description="Share your referral code so mothers can link to you and start messaging."
            />
          ) : (
            <ul className="divide-y divide-[var(--hairline)]">
              {patientsList.map(patient => {
                // No read receipts yet — a latest message from the patient is treated as awaiting reply.
                const isUnread = !!patient.latestMessage && patient.latestMessage.sender_id === patient.id

                return (
                  <li key={patient.id}>
                    <Link
                      href={`/doctor/messages/${patient.id}`}
                      className="group flex items-center gap-3.5 px-4 py-3.5 hover:bg-white/[0.025] sm:px-5"
                    >
                      <div className="relative shrink-0">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-semibold text-slate-200 ring-1 ring-[var(--hairline)]">
                          {patient.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                        </span>
                        <SeverityDot
                          severity={patient.status}
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 ring-2 ring-[var(--card)]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className={cn("truncate text-sm", isUnread ? "font-semibold text-white" : "font-medium text-slate-200")}>
                            {patient.name}
                          </p>
                          <span className={cn("num shrink-0 text-xs", isUnread ? "font-medium text-[var(--primary)]" : "text-slate-500")}>
                            {patient.latestMessage ? timeAgoShort(patient.latestMessage.created_at) : ""}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-3">
                          <p className={cn("truncate text-[13px]", isUnread ? "text-slate-200" : "text-[var(--muted-foreground)]")}>
                            {patient.latestMessage ? (
                              <>
                                {patient.latestMessage.sender_id === user.id && <span className="text-slate-500">You: </span>}
                                {patient.latestMessage.content}
                              </>
                            ) : (
                              <span className="italic text-slate-500">No messages yet</span>
                            )}
                          </p>
                          {isUnread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" /> : null}
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-slate-300" />
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
