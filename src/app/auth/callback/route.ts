import { createClient } from "@/lib/supabase/server"
import { bootstrapAccount } from "@/lib/account"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  let destination = "/mother/home"

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const account = await bootstrapAccount(supabase, user)
      destination = account.role === "doctor" ? "/doctor/dashboard" : "/mother/home"
    }
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
