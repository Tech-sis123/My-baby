"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type AppSupabaseClient = SupabaseClient<Database>

export async function signOutAndRedirect(
  supabase: AppSupabaseClient,
  destination: string
): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "global" })
  } catch {}

  window.location.replace(destination)
}
