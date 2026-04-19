import { createClient } from "@/lib/supabase/server"
import { evaluateCheckin } from "@/lib/rules"
import { getGestationalWeek, getBabyAgeDays } from "@/lib/utils"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { subject_type, subject_id, payload } = body

  if (!subject_type || !subject_id || !payload) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  // Get subject for context
  let gestational_week = 0
  let baby_age_days = 0

  if (subject_type === "pregnancy") {
    const { data: preg } = await supabase
      .from("pregnancies")
      .select("due_date")
      .eq("id", subject_id)
      .single()
    if (preg) gestational_week = getGestationalWeek(preg.due_date)
  } else {
    const { data: child } = await supabase
      .from("children")
      .select("birth_date")
      .eq("id", subject_id)
      .single()
    if (child) baby_age_days = getBabyAgeDays(child.birth_date)
  }

  // Get last 5 check-in payloads for streak rules
  const { data: recentCheckins } = await supabase
    .from("checkins")
    .select("payload")
    .eq("subject_id", subject_id)
    .order("created_at", { ascending: false })
    .limit(5)

  const recent_payloads = (recentCheckins || []).map(c => c.payload as Record<string, unknown>)

  // Insert check-in
  const { data: checkin, error: checkinError } = await supabase
    .from("checkins")
    .insert({ mother_id: user.id, subject_type, subject_id, payload })
    .select()
    .single()

  if (checkinError || !checkin) {
    return NextResponse.json({ error: checkinError?.message || "Insert failed" }, { status: 500 })
  }

  // Run rules
  const flagResults = evaluateCheckin({
    payload,
    subject_type,
    subject_id,
    gestational_week,
    baby_age_days,
    recent_payloads,
  })

  // Insert flags
  if (flagResults.length > 0) {
    await supabase.from("flags").insert(
      flagResults.map(f => ({
        mother_id: user.id,
        checkin_id: checkin.id,
        subject_type: f.subject_type,
        subject_id: f.subject_id,
        rule_id: f.rule_id,
        severity: f.severity,
        message: f.message,
      }))
    )
  }

  return NextResponse.json({ checkin_id: checkin.id, flags: flagResults })
}
