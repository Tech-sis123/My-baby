"use client"

import { useState, useEffect, useRef } from "react"
import { Send, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Message } from "@/lib/supabase/types"
import { getMessageHistory, sendMessage } from "@/lib/supabase/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatWindowProps {
  currentUserId: string
  partnerId: string
  partnerName: string
  partnerRole?: "doctor" | "mother"
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
      // Ideally show a toast error here
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
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-primary/10 text-primary shadow-sm font-medium text-sm">
          {partnerInitials}
        </div>
        <div className="ml-3 flex flex-col">
          <span className="font-semibold text-gray-900">{partnerName}</span>
          <span className="text-xs text-gray-500 capitalize">{partnerRole}</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 scroll-smooth">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-400">
            <div className="p-4 bg-gray-100 rounded-full">
              <User className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 hover:shadow-md ${
                    isMe
                      ? "bg-[var(--primary)] text-white rounded-tr-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-2 bg-gray-50 rounded-full p-1 border border-gray-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-10 shadow-none text-sm text-gray-900"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="h-10 w-10 rounded-full shrink-0 transition-transform active:scale-95"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
