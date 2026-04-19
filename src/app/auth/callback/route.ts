import { createClient } from "@/lib/supabase/server"
import { resolvePostAuthDestination, sanitizeNextPath } from "@/lib/account"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextPath = sanitizeNextPath(searchParams.get("next"))
  let destination = nextPath || "/mother/home"

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      destination = await resolvePostAuthDestination(supabase, user, nextPath)
    }
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
