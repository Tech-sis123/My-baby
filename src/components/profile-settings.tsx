"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, User, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Notice } from "@/components/app/status"
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

  const dirty = fullName !== initialFullName || phone !== initialPhone

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

    setSuccess("Profile updated.")
    setLoading(false)
    router.refresh()
  }

  const iconCls = "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-[var(--hairline)] px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-white">Personal profile</h2>
        <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">Shown to your linked care team.</p>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className={iconCls} />
            <Input id="email" value={email} readOnly className="cursor-not-allowed pl-10" />
          </div>
          <p className="text-xs text-slate-500">Your sign-in email can&apos;t be changed here.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User className={iconCls} />
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="pl-10" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <div className="relative">
            <Phone className={iconCls} />
            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" className="pl-10" />
          </div>
        </div>

        {error ? <Notice tone="error" className="sm:col-span-2">{error}</Notice> : null}
        {success ? <Notice tone="success" className="sm:col-span-2">{success}</Notice> : null}
      </div>

      <div className="flex justify-end border-t border-[var(--hairline)] bg-black/10 px-5 py-3 sm:px-6">
        <Button onClick={saveProfile} disabled={loading || !dirty}>
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  )
}
