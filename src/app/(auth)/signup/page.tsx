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
import { LoaderCircle } from "lucide-react"
import { Notice } from "@/components/app/status"
import { RoleSwitch } from "../role-switch"

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
  const role = searchParams.get("role") === "doctor" ? "doctor" : "mother"
  const nextPath = sanitizeNextPath(searchParams.get("next"))

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()

  function hardRedirect(destination: string) {
    window.location.replace(destination)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setInfo("")

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
      setInfo("Account created. Check your email to confirm your account, then sign in.")
      setLoading(false)
      return
    }

    const destination = await resolvePostAuthDestination(supabase, data.user, nextPath)

    hardRedirect(destination)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {role === "doctor" ? "Create clinician account" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          {role === "doctor"
            ? "Set up your triage dashboard and referral code."
            : "Start tracking your pregnancy or baby's care."}
        </p>
      </div>

      <RoleSwitch role={role} basePath="/signup" nextPath={nextPath} />

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder={role === "doctor" ? "Dr. Adaeze Okonkwo" : "Aisha Bello"}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
        </div>
        {role === "doctor" && (
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="clinicName">Clinic / hospital</Label>
              <Input
                id="clinicName"
                placeholder="Lagos Women's Health"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="text"
            inputMode="email"
            autoComplete="email"
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {info && <Notice tone="success">{info}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href={`/login?role=${role}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`} className="font-semibold text-[var(--primary)] hover:text-orange-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-[var(--muted-foreground)]">Loading…</p>}>
      <SignupPageContent />
    </Suspense>
  )
}
