"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { AuthError, User } from "@supabase/supabase-js"
import { bootstrapAccount } from "@/lib/account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type Role = "mother" | "doctor"

function resolveRole(user: User): Role {
  return user.user_metadata?.role === "doctor" ? "doctor" : "mother"
}

function getAuthErrorMessage(error: AuthError): string {
  const message = error.message.toLowerCase()

  if (message.includes("user already registered")) {
    return "An account with this email already exists. Please sign in instead."
  }

  if (message.includes("password")) {
    return "Password is too weak. Use at least 8 characters."
  }

  if (message.includes("email")) {
    return "Enter a valid email address."
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
  const nextPath = searchParams.get("next")

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function hardRedirect(destination: string) {
    window.location.replace(destination)
  }

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function redirectIfAuthenticated() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user || cancelled) return

      const role = resolveRole(session.user)
      void bootstrapAccount(supabase, session.user)
      if (cancelled) return

      hardRedirect(nextPath || (role === "doctor" ? "/doctor/dashboard" : "/mother/home"))
    }

    redirectIfAuthenticated()

    return () => {
      cancelled = true
    }
  }, [nextPath])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      setError("Check your email to confirm your account before signing in.")
      setLoading(false)
      return
    }

    void bootstrapAccount(supabase, data.user)
    const resolvedRole = resolveRole(data.user)
    const destination =
      nextPath || (resolvedRole === "doctor" ? "/doctor/dashboard" : "/mother/onboarding")

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
              type="email"
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
