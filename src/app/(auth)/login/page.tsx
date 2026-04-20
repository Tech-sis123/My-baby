"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { AuthError } from "@supabase/supabase-js"
import { bootstrapAccount, resolvePostAuthDestination } from "@/lib/account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function getAuthErrorMessage(error: AuthError): string {
  const message = error.message.toLowerCase()

  if (message.includes("invalid login credentials")) {
    return "Incorrect email or password."
  }

  if (message.includes("email not confirmed")) {
    return "Email confirmation is still enabled in Supabase for this project. Disable Confirm email in Supabase Auth if you want users to sign in immediately."
  }

  if (message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again."
  }

  if (message.includes("network")) {
    return "Network error. Check your connection and try again."
  }

  return error.message
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "doctor" ? "doctor" : "mother"
  const nextPath = searchParams.get("next")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()

  function hardRedirect(destination: string) {
    window.location.replace(destination)
  }

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function redirectIfAuthenticated() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      if (!user) return

      const destination = await resolvePostAuthDestination(supabase, user, nextPath)
      if (cancelled) return

      hardRedirect(destination)
    }

    redirectIfAuthenticated()

    return () => {
      cancelled = true
    }
  }, [nextPath])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Enter a valid email address.")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (authError) {
      setError(getAuthErrorMessage(authError))
      setLoading(false)
      return
    }

    if (!data.user || !data.session) {
      setError("Sign-in did not create a session. Check your email and password and try again.")
      setLoading(false)
      return
    }

    const account = await bootstrapAccount(supabase, data.user)

    if (account.role !== role) {
      await supabase.auth.signOut()
      setError(
        account.role === "doctor"
          ? "This account is registered as a doctor. Use the doctor login."
          : "This account is registered as a mother account. Use the mother login."
      )
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
        <CardTitle className="text-3xl">Welcome back</CardTitle>
        <CardDescription className="text-base">
          {role === "doctor" ? "Doctor login" : "Mother login"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Don&apos;t have an account?{" "}
          <Link href={`/signup?role=${role}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`} className="text-[var(--primary)] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="border-white/40 bg-white/90 p-8 text-center shadow-[0_30px_90px_rgba(17,24,39,0.12)] backdrop-blur">Loading…</Card>}>
      <LoginPageContent />
    </Suspense>
  )
}
