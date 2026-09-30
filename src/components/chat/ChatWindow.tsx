"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowUp, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Message } from "@/lib/supabase/types"
import { getMessageHistory, sendMessage } from "@/lib/supabase/messages"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  currentUserId: string
  partnerId: string
  partnerName: string
  partnerRole?: "doctor" | "mother"
}

function dayLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })
}

export function ChatWindow({
  currentUserId,
  partnerId,
  partnerName,
  partnerRole = "doctor"
}: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch initial messages
    const loadMessages = async () => {
      setLoading(true)
      const history = await getMessageHistory(supabase, currentUserId, partnerId)
      setMessages(history)
      setLoading(false)
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${currentUserId}_${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.sender_id === partnerId) {
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, partnerId, supabase])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const tempMessage: Message = {
      id: crypto.randomUUID(),
      sender_id: currentUserId,
      receiver_id: partnerId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    }

    // Optimistic UI update
    setMessages((prev) => [...prev, tempMessage])
    setNewMessage("")

    const sentMessage = await sendMessage(supabase, currentUserId, partnerId, tempMessage.content)
    if (!sentMessage) {
      // Revert if failed (simplified error handling)
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      setNewMessage(tempMessage.content)
    } else {
      // Replace temp id with real id
      setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? sentMessage : m)))
    }
  }

  const partnerInitials = partnerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="surface flex h-full min-h-[420px] w-full flex-col overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
          {partnerInitials}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-white">{partnerName}</p>
          <p className="text-xs capitalize text-[var(--muted-foreground)]">{partnerRole === "doctor" ? "Your doctor" : "Patient"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-1.5 overflow-y-auto bg-[var(--surface-sunken)] px-4 py-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.04] text-slate-400">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">No messages yet</p>
              <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">Send a message to start the conversation.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId
            const prev = messages[index - 1]
            const showDay = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString()
            const grouped = prev && prev.sender_id === msg.sender_id && !showDay
            return (
              <div key={msg.id}>
                {showDay ? (
                  <p className="my-3 text-center text-[11px] font-medium text-slate-500">{dayLabel(msg.created_at)}</p>
                ) : null}
                <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start", !grouped && "pt-1.5")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed",
                      isMe
                        ? "rounded-br-md bg-[var(--primary)] text-white"
                        : "rounded-bl-md bg-[var(--card)] text-slate-100 ring-1 ring-[var(--hairline)]"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={cn("mt-0.5 text-right text-[10px]", isMe ? "text-orange-100/80" : "text-slate-500")}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--hairline)] p-3">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] p-1.5 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-soft)]"
        >
          <input
            type="text"
            placeholder="Write a message…"
            aria-label="Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="h-10 flex-1 bg-transparent px-2.5 text-[15px] text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white hover:bg-[#EA6A0C] disabled:bg-white/[0.06] disabled:text-slate-500"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
