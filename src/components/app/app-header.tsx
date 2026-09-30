"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import {
  Bot,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { signOutAndRedirect } from "@/lib/auth-client"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Brand } from "./brand"

type NavItem = { href: string; label: string; icon: LucideIcon }

const NAV: Record<"mother" | "doctor", NavItem[]> = {
  mother: [
    { href: "/mother/home", label: "Home", icon: LayoutDashboard },
    { href: "/mother/appointments", label: "Visits", icon: CalendarDays },
    { href: "/mother/messages", label: "Messages", icon: MessageSquare },
    { href: "/mother/ask", label: "Assistant", icon: Bot },
    { href: "/mother/settings", label: "Settings", icon: Settings },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/messages", label: "Messages", icon: MessageSquare },
    { href: "/doctor/ask", label: "Assistant", icon: Bot },
    { href: "/doctor/settings", label: "Settings", icon: Settings },
  ],
}

interface Props {
  role: "mother" | "doctor"
  userName?: string
  userMeta?: string
  right?: ReactNode
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AppHeader({ role, userName, userMeta, right }: Props) {
  const pathname = usePathname()
  const items = NAV[role]
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  async function handleSignOut() {
    await signOutAndRedirect(createClient(), `/login?role=${role}`)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[rgba(17,24,39,0.85)] backdrop-blur-md">
        <div className="page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Brand
              href={items[0].href}
              tagline={role === "doctor" ? "Clinician workspace" : "Care companion"}
            />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive(item.href)
                      ? "bg-white/[0.06] text-white"
                      : "text-[var(--muted-foreground)] hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {right}
            {userName ? (
              <div className="hidden items-center gap-2.5 border-l border-[var(--hairline)] pl-3 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] text-[11px] font-semibold text-slate-200 ring-1 ring-[var(--hairline)]">
                  {initials(userName)}
                </span>
                <div className="hidden leading-tight lg:block">
                  <p className="max-w-[160px] truncate text-[13px] font-medium text-white">{userName}</p>
                  {userMeta ? <p className="max-w-[160px] truncate text-[11px] text-[var(--muted-foreground)]">{userMeta}</p> : null}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[rgba(17,24,39,0.95)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="flex">
          {items.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                  active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
