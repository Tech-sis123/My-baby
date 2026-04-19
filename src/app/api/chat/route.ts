import Groq from "groq-sdk"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MOTHER_SYSTEM_PROMPT = `You are a warm maternal and baby-care assistant inside the My Baby app. Give calm, practical, non-judgmental answers about pregnancy, breastfeeding, newborn care, infant routines, feeding, hydration, development, and what to monitor next.

Rules:
- Keep answers concise, clear, and useful in plain language.
- Start with the direct answer, then give short next steps.
- If the situation sounds urgent or unsafe, clearly say they should contact their doctor or go to the nearest hospital now.
- Do not use alarming language unless the situation described is genuinely concerning.
- Do not claim to be a doctor or pretend to replace medical care.
- If something important is missing, ask at most 2 focused follow-up questions.`

const DOCTOR_SYSTEM_PROMPT = `You are a concise maternal and child-health copilot for doctors using the My Baby app. The user may ask about pregnancy or pediatric patient scenarios and wants structured clinical support, not a generic essay.

Rules:
- Respond in this order when possible: Clinical synthesis, Immediate priorities, Key follow-up questions, Escalation threshold.
- Stay brief, concrete, and operational.
- Be transparent about uncertainty and missing information.
- Do not give a definitive diagnosis when the scenario is incomplete.
- Do not say you replace clinical judgment; instead support decision-making and triage reasoning.
- Focus on maternal, newborn, infant, and linked doctor-patient follow-up context.
- If the scenario sounds emergent, say so clearly and early.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const { messages } = await req.json()
  if (!Array.isArray(messages)) return NextResponse.json({ error: "Invalid messages" }, { status: 400 })

  const safeMessages = messages
    .filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        !!message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    )
    .slice(-10)

  if (safeMessages.length === 0) {
    return NextResponse.json({ error: "No usable messages provided" }, { status: 400 })
  }

  const systemPrompt = profile?.role === "doctor" ? DOCTOR_SYSTEM_PROMPT : MOTHER_SYSTEM_PROMPT
  const isDoctor = profile?.role === "doctor"

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...safeMessages,
    ],
    stream: true,
    max_tokens: isDoctor ? 420 : 320,
    temperature: isDoctor ? 0.35 : 0.55,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ""
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
