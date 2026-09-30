"use client"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { AuthError } from "@supabase/supabase-js"
import { bootstrapAccount, resolvePostAuthDestination } from "@/lib/account"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoaderCircle } from "lucide-react"
import { Notice } from "@/components/app/status"
import { RoleSwitch } from "../role-switch"

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          Sign in to your {role === "doctor" ? "clinician workspace" : "care dashboard"}.
        </p>
      </div>

      <RoleSwitch role={role} basePath="/login" nextPath={nextPath} />

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Don&apos;t have an account?{" "}
        <Link href={`/signup?role=${role}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`} className="font-semibold text-[var(--primary)] hover:text-orange-300">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-[var(--muted-foreground)]">Loading…</p>}>
      <LoginPageContent />
    </Suspense>
  )
}
