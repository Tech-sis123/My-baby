"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, Bot, ClipboardList, Sparkles } from "lucide-react"
import { AppHeader } from "@/components/app/app-header"
import { cn } from "@/lib/utils"

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
  title,
  subtitle,
  intro,
  placeholder,
  contextSummary,
  promptSuggestions,
}: AskAIClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: intro }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

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
  const isFresh = messages.length === 1
  const lastMessage = messages[messages.length - 1]
  const showTyping = streaming && lastMessage?.role === "user"

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
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || `Failed to get response (${response.status})`)
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
    <div className="flex h-[100dvh] flex-col pb-[64px] md:pb-0">
      <AppHeader role={role} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {/* Title */}
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-white">{title}</h1>
              <p className="text-[13px] text-[var(--muted-foreground)]">{subtitle}</p>
            </div>
          </div>

          {contextSummary ? (
            <div className="surface mb-6 p-4">
              <p className="eyebrow flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Case context
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{contextSummary}</p>
            </div>
          ) : null}

          {/* Messages */}
          <div className="space-y-6">
            {messages.map((message, index) =>
              message.role === "user" ? (
                <div key={`u-${index}`} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--muted)] px-4 py-2.5 text-[15px] leading-relaxed text-slate-100 ring-1 ring-[var(--hairline)]">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ) : (
                <div key={`a-${index}`} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Bot className="h-4 w-4" />
                  </span>
                  <p
                    className={cn(
                      "min-w-0 flex-1 whitespace-pre-wrap pt-0.5 text-[15px] leading-relaxed",
                      message.content.startsWith("Error:") ? "text-red-300" : "text-slate-200"
                    )}
                  >
                    {message.content}
                  </p>
                </div>
              )
            )}

            {showTyping ? (
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1 pt-2">
                  {[0, 0.15, 0.3].map(delay => (
                    <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            ) : null}

            {isFresh ? (
              <div className="grid gap-2.5 pt-2 sm:grid-cols-2">
                {prompts.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setInput(prompt)
                      inputRef.current?.focus()
                    }}
                    className="surface p-3.5 text-left text-[13px] leading-snug text-slate-300 hover:border-slate-500 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            <div ref={scrollRef} />
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[var(--hairline)] bg-[var(--background)]">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
          <form
            onSubmit={event => {
              event.preventDefault()
              handleSendMessage()
            }}
            className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] p-1.5 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-soft)]"
          >
            <textarea
              ref={inputRef}
              rows={1}
              placeholder={placeholder}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  if (!loading) handleSendMessage()
                }
              }}
              disabled={loading}
              aria-label="Message"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white hover:bg-[#EA6A0C] disabled:bg-white/[0.06] disabled:text-slate-500"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            AI guidance can be wrong and is not a diagnosis. For urgent symptoms, contact your doctor or nearest hospital.
          </p>
        </div>
      </div>
    </div>
  )
}
