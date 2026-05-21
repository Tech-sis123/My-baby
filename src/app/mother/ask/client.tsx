"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { signOutAndRedirect } from "@/lib/auth-client"
import {
  ChevronLeft,
  ClipboardList,
  HeartPulse,
  Lightbulb,
  LogOut,
  Send,
  Stethoscope,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

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
  contextSummary?: string | null
  promptSuggestions?: string[]
}

export function AskAIClient({
  role,
  homeHref,
  title,
  subtitle,
  intro,
  placeholder,
  contextSummary,
  promptSuggestions,
}: AskAIClientProps) {
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: intro }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const defaultPrompts =
    role === "doctor"
      ? [
          "My pregnant patient is 32 weeks, reports severe headache and swelling, and had a high blood pressure reading. What should I review first?",
          "This baby has fewer wet diapers today and the mother reports low mood. What are the likely priorities and counseling points?",
          "Help me structure a callback for a mother with a yellow-flag pregnancy check-in.",
          "Summarize what follow-up questions I should ask before recommending next steps.",
        ]
      : [
          "I am 24 weeks pregnant and I feel more tired than usual. What should I watch and what is normal?",
          "My baby is feeding less today and has had fewer wet diapers. What should I check next?",
          "Help me understand what information to include in my next check-in.",
          "Give me a short list of questions to ask my doctor about my baby's feeding.",
        ]

  const prompts = promptSuggestions && promptSuggestions.length > 0 ? promptSuggestions : defaultPrompts

  const panelIcon = role === "doctor" ? <Stethoscope className="h-3.5 w-3.5" /> : <HeartPulse className="h-3.5 w-3.5" />

  async function handleSignOut() {
    await signOutAndRedirect(supabase, role === "doctor" ? "/login?role=doctor" : "/login?role=mother")
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
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[rgba(43,37,31,0.88)] px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={homeHref}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
                {panelIcon} {role === "doctor" ? "Clinical copilot" : "Care assistant"}
              </div>
              <h1 className="text-base font-semibold text-white">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[var(--muted-foreground)] sm:block">{subtitle}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Body: chat + sidebar */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 overflow-hidden px-4 py-4 2xl:gap-4">

        {/* Chat */}
        <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)]">
          {/* Message count */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.26em] text-[var(--primary)]">Conversation</p>
            <span className="text-xs text-[var(--muted-foreground)]">{messages.length} messages</span>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                    message.role === "user"
                      ? "border border-[rgba(201,139,88,0.24)] bg-[rgba(201,139,88,0.12)] text-white"
                      : "border border-[var(--border)] bg-[rgba(42,34,28,0.5)] text-[var(--foreground)]"
                  }`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {streaming ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[var(--border)] bg-[rgba(42,34,28,0.5)] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]" style={{ animationDelay: "0.1s" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
            <div className="flex gap-2">
              <Input
                placeholder={placeholder}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && !loading) handleSendMessage()
                }}
                disabled={loading}
                className="flex-1"
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
        </section>

        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 space-y-3 overflow-y-auto 2xl:block">

          {/* Context summary */}
          {contextSummary ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <ClipboardList className="h-3.5 w-3.5" /> Case context
              </div>
              <p className="mt-2 text-xs leading-5 text-white">{contextSummary}</p>
            </div>
          ) : null}

          {/* Prompt starters */}
          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              <Lightbulb className="h-3.5 w-3.5" /> {role === "doctor" ? "Doctor prompts" : "Prompt starters"}
            </div>
            <div className="mt-3 space-y-2">
              {prompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-3 text-left text-xs leading-5 text-white transition hover:border-[rgba(201,139,88,0.34)] hover:bg-[rgba(255,248,239,0.08)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
