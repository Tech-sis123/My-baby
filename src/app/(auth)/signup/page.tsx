"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = (searchParams.get("role") || "mother") as "mother" | "doctor"

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
          ...(role === "doctor" ? { specialty, clinic_name: clinicName } : {}),
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (role === "doctor") {
      router.push("/doctor/dashboard")
    } else {
      router.push("/mother/onboarding")
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="text-4xl mb-2">👶</div>
        <CardTitle className="text-2xl">
          {role === "doctor" ? "Create doctor account" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {role === "doctor"
            ? "Join My Baby as a healthcare provider"
            : "Your pregnancy and baby health companion"}
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
            <p className="text-sm text-[var(--destructive)] bg-red-50 p-3 rounded-xl">{error}</p>
          )}

          {/* AI chat disclaimer at signup */}
          <p className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] p-3 rounded-xl">
            The AI assistant in this app provides general information only — it is not a doctor and cannot diagnose or treat conditions. For any symptoms or emergencies, contact your healthcare provider.
          </p>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Already have an account?{" "}
          <Link href={`/login?role=${role}`} className="text-[var(--primary)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
