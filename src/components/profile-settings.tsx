"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, LoaderCircle, User, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface Props {
  userId: string
  initialFullName: string
  initialPhone: string
  email: string
}

export function ProfileSettings({ userId, initialFullName, initialPhone, email }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function saveProfile() {
    if (!fullName.trim()) {
      setError("Full name cannot be empty.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      })
      .eq("id", userId)

    if (saveError) {
      setError(saveError.message)
      setLoading(false)
      return
    }

    setSuccess("Profile updated successfully.")
    setLoading(false)
    router.refresh()
  }

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(73,60,51,0.72)] p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
        <User className="h-4 w-4" /> Personal Profile
      </div>
      
      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-2">
            Email Address (Read-only)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              id="email"
              value={email}
              readOnly
              className="pl-10 bg-[rgba(255,248,239,0.02)] border-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="pl-10 bg-[rgba(255,248,239,0.05)] border-[var(--border)] text-white focus-visible:ring-[var(--primary)]/30"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              id="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="pl-10 bg-[rgba(255,248,239,0.05)] border-[var(--border)] text-white focus-visible:ring-[var(--primary)]/30"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-[1.25rem] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button onClick={saveProfile} disabled={loading} className="w-full sm:w-auto bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 px-8 rounded-full shadow-lg">
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Saving Profile..." : "Save Profile"}
        </Button>
      </div>
    </section>
  )
}
