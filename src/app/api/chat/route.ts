import Groq from "groq-sdk"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are a friendly maternal health information assistant in the My Baby app, used by pregnant women and new mothers primarily in Nigeria. Answer general questions about pregnancy, breastfeeding, infant care, nutrition, and normal development. You are NOT a doctor. You must NEVER diagnose, recommend specific medications, or give advice on specific symptoms. If a user describes symptoms, redirect them to contact their doctor. If they describe anything urgent (bleeding, severe pain, baby not breathing, high fever), tell them to go to the nearest hospital immediately. Be warm, brief (under 150 words per response), and culturally aware of Nigerian context. Never pretend to be a human.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages } = await req.json()
  if (!Array.isArray(messages)) return NextResponse.json({ error: "Invalid messages" }, { status: 400 })

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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
