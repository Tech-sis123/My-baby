import { createClient } from "@/lib/supabase/server"
import { getGestationalWeek } from "@/lib/utils"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ week: 0 })

  const supabase = await createClient()
  const { data } = await supabase.from("pregnancies").select("due_date").eq("id", id).single()
  const week = data ? getGestationalWeek(data.due_date) : 0
  return NextResponse.json({ week })
}
