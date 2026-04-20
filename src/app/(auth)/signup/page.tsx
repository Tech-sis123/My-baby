"use client"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { AuthError } from "@supabase/supabase-js"
import { resolvePostAuthDestination, sanitizeNextPath } from "@/lib/account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function getAuthErrorMessage(error: AuthError): string {
  const message = error.message.toLowerCase()

  if (message.includes("user already registered")) {
    return "An account with this email already exists. Please sign in instead."
  }

  if (message.includes("invalid email") || message.includes("email address is invalid")) {
    return "Enter a valid email address."
  }

  if (message.includes("password")) {
    return "Password is too weak. Use at least 8 characters."
  }

  if (message.includes("email signups are disabled") || message.includes("signups not allowed")) {
    return "Email signup is currently disabled in Supabase Auth settings."
  }

  if (message.includes("email rate limit exceeded") || message.includes("over_email_send_rate_limit")) {
    return "Too many email attempts right now. Please wait a moment and try again."
  }

  if (message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again."
  }

  if (message.includes("network")) {
    return "Network error. Check your connection and try again."
  }

  return error.message
}

function SignupPageContent() {
  const searchParams = useSearchParams()
  const role = (searchParams.get("role") || "mother") as "mother" | "doctor"
  const nextPath = sanitizeNextPath(searchParams.get("next"))

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()

  function hardRedirect(destination: string) {
    window.location.replace(destination)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Enter a valid email address.")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`,
        data: {
          role,
          full_name: fullName,
          ...(role === "doctor" ? { specialty, clinic_name: clinicName } : {}),
        },
      },
    })

    if (authError) {
      setError(getAuthErrorMessage(authError))
      setLoading(false)
      return
    }

    if (!data.user) {
      setError("Account was created incorrectly. Please try again.")
      setLoading(false)
      return
    }

    if (!data.session) {
      setError("Account created, but email confirmation is still enabled in Supabase. Disable Confirm email in Supabase Auth if you want users to sign in immediately.")
      setLoading(false)
      return
    }

    const destination = await resolvePostAuthDestination(supabase, data.user, nextPath)

    hardRedirect(destination)
  }

  return (
    <Card className="border-[rgba(255,255,255,0.08)] bg-[rgba(19,20,23,0.86)] shadow-none backdrop-blur">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-2 inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          {role === "doctor" ? "Doctor Portal" : "Mother Portal"}
        </div>
        <CardTitle className="text-3xl">
          {role === "doctor" ? "Create doctor account" : "Create your account"}
        </CardTitle>
        <CardDescription className="text-base">
          {role === "doctor"
            ? "Set up your dashboard, referral code, and patient view."
            : "Start your pregnancy or baby-care dashboard with your saved profile."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder={role === "doctor" ? "Dr. Adaeze Okonkwo" : "Aisha Bello"}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
          {role === "doctor" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  placeholder="Obstetrician"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic / Hospital name</Label>
                <Input
                  id="clinicName"
                  placeholder="Lagos Women's Health"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Already have an account?{" "}
          <Link href={`/login?role=${role}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`} className="text-[var(--primary)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Card className="border-white/40 bg-white/90 p-8 text-center shadow-[0_30px_90px_rgba(17,24,39,0.12)] backdrop-blur">Loading…</Card>}>
      <SignupPageContent />
    </Suspense>
  )
}
