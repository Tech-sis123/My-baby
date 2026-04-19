import Groq from "groq-sdk"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MOTHER_SYSTEM_PROMPT = `You are a warm maternal and baby-care assistant in the My Baby app. Answer clearly about pregnancy, breastfeeding, infant care, nutrition, development, routines, and next-step monitoring. Keep responses brief, practical, and calm. If symptoms sound urgent, say they should contact their doctor or go to the nearest hospital. Do not pretend to be a human.`

const DOCTOR_SYSTEM_PROMPT = `You are a concise maternal and child health copilot for doctors using the My Baby app. The user may ask about a patient scenario. Respond in a clinically useful structure: likely concern, immediate priorities, follow-up questions, and when to escalate. Be brief, evidence-aware, and transparent about uncertainty. Do not claim to replace clinical judgment.`

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

  const systemPrompt = profile?.role === "doctor" ? DOCTOR_SYSTEM_PROMPT : MOTHER_SYSTEM_PROMPT

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ],
    stream: true,
    max_tokens: 300,
    temperature: 0.7,
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
