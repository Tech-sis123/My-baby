"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { signOutAndRedirect } from "@/lib/auth-client"
import {
  Bot,
  ChevronLeft,
  ClipboardList,
  HeartPulse,
  Lightbulb,
  LogOut,
  Send,
  ShieldCheck,
  Sparkles,
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

  const config =
    role === "doctor"
      ? {
          heroLabel: "Clinical copilot",
          heroTitle: "Use AI as a structured thinking partner for linked patient review.",
          heroBody:
            "Keep prompts grounded in symptoms, check-in findings, and what kind of next-step support you want. The strongest outputs come from concrete patient context, not vague summaries.",
          promptTitle: "Doctor prompt starters",
          prompts: [
            "My pregnant patient is 32 weeks, reports severe headache and swelling, and had a high blood pressure reading. What should I review first?",
            "This baby has fewer wet diapers today and the mother reports low mood. What are the likely priorities and counseling points?",
            "Help me structure a callback for a mother with a yellow-flag pregnancy check-in.",
            "Summarize what follow-up questions I should ask before recommending next steps.",
          ],
          workflows: [
            "Triage a new red or yellow check-in before calling the patient.",
            "Prepare for a focused follow-up conversation or clinic visit.",
            "Generate a cleaner checklist from scattered symptoms and notes.",
          ],
          note:
            "AI can support clinical reasoning and communication prep, but it should not replace your own judgment, formal protocols, or urgent escalation.",
          badgeTone: "border-red-400/22 bg-red-500/8 text-red-100",
          panelIcon: <Stethoscope className="h-4 w-4" />,
        }
      : {
          heroLabel: "Care assistant",
          heroTitle: "Ask about pregnancy, baby care, and what to watch next without digging through menus.",
          heroBody:
            "Use plain language. The assistant works best when you describe what is happening right now, how long it has been happening, and whether it is about pregnancy or your baby.",
          promptTitle: "Mother prompt starters",
          prompts: [
            "I am 24 weeks pregnant and I feel more tired than usual. What should I watch and what is normal?",
            "My baby is feeding less today and has had fewer wet diapers. What should I check next?",
            "Help me understand what information to include in my next check-in.",
            "Give me a short list of questions to ask my doctor about my baby’s feeding.",
          ],
          workflows: [
            "Understand whether a symptom sounds routine or worth checking quickly.",
            "Prepare better notes before a doctor appointment or callback.",
            "Turn worry into a clearer next step instead of guessing.",
          ],
          note:
            "AI can still make mistakes. Use it as support, and contact your doctor or emergency care quickly if something feels urgent or unsafe.",
          badgeTone: "border-emerald-400/22 bg-emerald-500/8 text-emerald-100",
          panelIcon: <HeartPulse className="h-4 w-4" />,
        }
  const prompts = promptSuggestions && promptSuggestions.length > 0 ? promptSuggestions : config.prompts

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
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[rgba(77,64,54,0.74)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link href={homeHref}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">{config.heroLabel}</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">{title}</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <section className="panel-float overflow-hidden rounded-[2.25rem] border border-[var(--border)] bg-[rgba(73,60,51,0.76)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,139,88,0.26)] bg-[rgba(201,139,88,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]">
                <Bot className="h-3.5 w-3.5" /> {config.heroLabel}
              </div>

              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {config.heroTitle}
              </h2>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                {config.heroBody}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    <ClipboardList className="h-4 w-4" /> Best prompts include
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white">Symptoms, timing, track type, and what support you want back.</p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,248,239,0.08)] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    {config.panelIcon} Good for
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white">Next-step thinking, structured follow-up, and cleaner explanations.</p>
                </div>
                <div className={`rounded-[1.35rem] border p-4 ${config.badgeTone}`}>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
                    <ShieldCheck className="h-4 w-4" /> Important note
                  </div>
                  <p className="mt-3 text-sm leading-6">{config.note}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] p-6 xl:border-l xl:border-t-0">
              <div className="rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                {contextSummary ? (
                  <div className="mb-4 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      <ClipboardList className="h-4 w-4" /> Active case context
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white">{contextSummary}</p>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <Lightbulb className="h-4 w-4" /> {config.promptTitle}
                </div>

                <div className="mt-5 space-y-3">
                  {prompts.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="w-full rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4 text-left text-sm leading-6 text-white transition hover:border-[rgba(201,139,88,0.34)] hover:bg-[rgba(255,248,239,0.08)]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[1.7rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  <Sparkles className="h-4 w-4" /> Use it for
                </div>
                <div className="mt-5 space-y-3">
                  {config.workflows.map(item => (
                    <div
                      key={item}
                      className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3 text-sm leading-6 text-white"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.18fr_0.82fr]">
          <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">Conversation</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">AI workspace</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Ask, refine, and continue with context instead of starting over each time.
                </p>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[rgba(255,248,239,0.06)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                {messages.length} messages
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-3xl rounded-[1.45rem] px-4 py-3 text-sm leading-7 ${
                      message.role === "user"
                        ? "border border-[rgba(201,139,88,0.24)] bg-[rgba(201,139,88,0.12)] text-white"
                        : "border border-[var(--border)] bg-[rgba(42,34,28,0.35)] text-[var(--foreground)]"
                    }`}
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                      {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {streaming ? (
                <div className="flex justify-start">
                  <div className="rounded-[1.45rem] border border-[var(--border)] bg-[rgba(42,34,28,0.35)] px-4 py-3">
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
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Sparkles className="h-4 w-4" /> Compose a better prompt
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Start with</p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    Who the question is about, what is happening, and when it started.
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,248,239,0.05)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Then add</p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    Check-in details, warning signs, what you already know, and what decision support you want.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Send className="h-4 w-4" /> Ask now
              </div>

              <div className="mt-5 flex gap-2">
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
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
