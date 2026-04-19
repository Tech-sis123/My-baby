import type { User, SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type AppSupabaseClient = SupabaseClient<Database>
type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"]

const INVITE_SUFFIX_LENGTH = 4

export function normalizeInviteCode(input: string): string {
  return input
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 24)
}

export function buildDefaultInviteCode(fullName: string | null | undefined, userId: string): string {
  const fromName = normalizeInviteCode(fullName || "MY-BABY-DOCTOR")
  const suffix = userId.replace(/-/g, "").slice(0, INVITE_SUFFIX_LENGTH).toUpperCase()
  const base = fromName || "MY-BABY-DOCTOR"
  return normalizeInviteCode(`${base}-${suffix}`)
}

export function sanitizeNextPath(nextPath: string | null | undefined): string | null {
  if (!nextPath) return null
  if (!nextPath.startsWith("/")) return null
  if (nextPath.startsWith("//")) return null
  return nextPath
}

export async function bootstrapAccount(supabase: AppSupabaseClient, user: User) {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const role: Role = metadata.role === "doctor" ? "doctor" : "mother"
  const fullName = typeof metadata.full_name === "string" && metadata.full_name.trim()
    ? metadata.full_name.trim()
    : null
  const phone = typeof metadata.phone === "string" && metadata.phone.trim()
    ? metadata.phone.trim()
    : null
  const specialty = typeof metadata.specialty === "string" && metadata.specialty.trim()
    ? metadata.specialty.trim()
    : null
  const clinicName = typeof metadata.clinic_name === "string" && metadata.clinic_name.trim()
    ? metadata.clinic_name.trim()
    : null

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone")
    .eq("id", user.id)
    .maybeSingle()

  const profilePayload = {
    id: user.id,
    role: existingProfile?.role || role,
    full_name: existingProfile?.full_name || fullName,
    phone: existingProfile?.phone || phone,
  }

  await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" })

  if (profilePayload.role !== "doctor") {
    return { role: profilePayload.role, inviteCode: null }
  }

  const { data: existingDoctor } = await supabase
    .from("doctors")
    .select("user_id, invite_code, specialty, clinic_name")
    .eq("user_id", user.id)
    .maybeSingle()

  const inviteCode = existingDoctor?.invite_code || buildDefaultInviteCode(profilePayload.full_name, user.id)

  await supabase.from("doctors").upsert(
    {
      user_id: user.id,
      invite_code: inviteCode,
      specialty: existingDoctor?.specialty || specialty,
      clinic_name: existingDoctor?.clinic_name || clinicName,
    },
    { onConflict: "user_id" }
  )

  return { role: "doctor" as const, inviteCode }
}

export async function resolvePostAuthDestination(
  supabase: AppSupabaseClient,
  user: User,
  nextPath?: string | null
) {
  const safeNextPath = sanitizeNextPath(nextPath)
  if (safeNextPath) return safeNextPath

  const account = await bootstrapAccount(supabase, user)

  if (account.role === "doctor") {
    return "/doctor/dashboard"
  }

  const [{ data: pregnancy }, { data: child }] = await Promise.all([
    supabase
      .from("pregnancies")
      .select("id")
      .eq("mother_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("children")
      .select("id")
      .eq("mother_id", user.id)
      .is("archived_at", null)
      .limit(1)
      .maybeSingle(),
  ])

  return pregnancy || child ? "/mother/home" : "/mother/onboarding"
}
