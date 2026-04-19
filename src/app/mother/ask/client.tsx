"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, ChevronLeft, LogOut, Send } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AskAIClientProps {
  role: "mother" | "doctor"
  homeHref: string
  title: string
  subtitle: string
  intro: string
  placeholder: string
}

export function AskAIClient({ homeHref, title, subtitle, intro, placeholder }: AskAIClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: intro },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  async function handleSendMessage() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    const nextMessages = [...messages, { role: "user" as const, content: userMessage }]
    setInput("")
    setMessages(nextMessages)
    setLoading(true)
    setStreaming(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      if (reader) {
        setMessages(prev => [...prev, { role: "assistant", content: "" }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          setMessages(prev => {
            const updated = [...prev]
            const lastMessage = updated[updated.length - 1]
            if (lastMessage && lastMessage.role === "assistant") {
              lastMessage.content = assistantMessage
            }
            return updated
          })
        }
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        },
      ])
    } finally {
      setStreaming(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[rgba(8,17,31,0.72)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={homeHref}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{subtitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-89px)] w-full max-w-4xl flex-col px-4 py-6">
        <div className="rounded-[1.8rem] border border-[rgba(125,211,252,0.18)] bg-[rgba(8,17,31,0.76)] p-5 shadow-[0_30px_90px_rgba(8,17,31,0.3)] backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[#9ae6de]">
            <Bot className="h-4 w-4" /> AI conversation
          </div>
          <div className="mt-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xl rounded-[1.4rem] px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-[rgba(20,184,166,0.18)] text-white"
                      : "border border-[var(--border)] bg-[rgba(8,17,31,0.52)] text-[var(--foreground)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {streaming && (
              <div className="flex justify-start">
                <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(8,17,31,0.52)] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#7dd3fc] animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-[#7dd3fc] animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="h-2 w-2 rounded-full bg-[#7dd3fc] animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <div className="mt-4 rounded-[1.6rem] border border-[var(--border)] bg-[rgba(8,17,31,0.78)] p-4 backdrop-blur">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !loading) handleSendMessage()
              }}
              disabled={loading}
              className="flex-1 bg-[rgba(8,17,31,0.4)] text-white"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
