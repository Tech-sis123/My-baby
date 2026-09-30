import Image from "next/image"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Baby,
  BellRing,
  Bot,
  Check,
  ClipboardList,
  HeartPulse,
  Link2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MedicalFooter } from "@/components/medical-footer"
import { Brand } from "@/components/app/brand"
import { SeverityBadge, SeverityDot } from "@/components/app/status"

const MOTHER_IMAGE =
  "https://images.pexels.com/photos/35136012/pexels-photo-35136012.jpeg?auto=compress&cs=tinysrgb&w=1200"

const audiences = [
  {
    eyebrow: "For mothers",
    title: "A calm daily check-in for you and your baby",
    icon: Baby,
    points: [
      "Pregnancy and baby care tracked on separate, focused paths",
      "Weekly guidance matched to your stage",
      "Warning signs flagged instantly — and shared with your doctor",
    ],
    cta: { href: "/signup?role=mother", label: "Create mother account" },
  },
  {
    eyebrow: "For clinicians",
    title: "A triage board that surfaces who needs you first",
    icon: Stethoscope,
    points: [
      "Linked patients sorted urgent → review → stable",
      "Live updates the moment a check-in is submitted",
      "One referral code links every patient to your workspace",
    ],
    cta: { href: "/signup?role=doctor", label: "Create doctor account" },
  },
]

const steps = [
  {
    icon: ClipboardList,
    title: "Choose a care path",
    body: "Start as pregnant, with a baby, or both. The app only shows what matters for that stage.",
  },
  {
    icon: Link2,
    title: "Link your doctor",
    body: "Enter your doctor's referral code so every check-in reaches their dashboard automatically.",
  },
  {
    icon: BellRing,
    title: "Act on what matters",
    body: "Red flags surface first. Doctors follow up, schedule callbacks, and message directly.",
  },
]

const capabilities = [
  { icon: HeartPulse, label: "Antenatal tracking" },
  { icon: Baby, label: "Newborn check-ins" },
  { icon: Activity, label: "Real-time triage" },
  { icon: Bot, label: "AI care assistant" },
  { icon: ShieldCheck, label: "Private by design" },
]

export const metadata = {
  title: "My Baby — Maternal & Child Health",
  description: "Daily health tracking for pregnancy and early childhood, with real-time alerts for your doctor.",
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--card)]">
        <Image
          src={MOTHER_IMAGE}
          alt="Mother holding her newborn"
          width={1200}
          height={1400}
          priority
          className="h-[340px] w-full object-cover object-[center_20%] sm:h-[460px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/20 to-transparent" />
      </div>

      {/* Floating check-in card */}
      <div className="surface absolute -bottom-6 left-4 right-4 p-4 shadow-2xl shadow-black/40 sm:left-6 sm:right-auto sm:w-[300px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="data-label">Daily check-in</p>
            <p className="mt-0.5 text-sm font-semibold text-white">Pregnancy · Week 32</p>
          </div>
          <SeverityBadge severity="green" label="All clear" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { k: "BP", v: "118/76" },
            { k: "Movement", v: "Normal" },
            { k: "Feeling", v: "Good" },
          ].map(item => (
            <div key={item.k} className="surface-sunken px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{item.k}</p>
              <p className="num mt-0.5 text-[13px] font-semibold text-slate-100">{item.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating triage card */}
      <div className="surface absolute -top-5 right-4 hidden w-[230px] p-3.5 shadow-2xl shadow-black/40 sm:block lg:-right-6">
        <p className="data-label mb-2.5">Clinician queue</p>
        <div className="space-y-2">
          {[
            { n: "A. Bello", s: "red" as const, t: "Severe headache" },
            { n: "C. Eze", s: "yellow" as const, t: "Low wet diapers" },
            { n: "T. Adebayo", s: "green" as const, t: "Feeding well" },
          ].map(row => (
            <div key={row.n} className="flex items-center gap-2.5">
              <SeverityDot severity={row.s} />
              <span className="text-[13px] font-medium text-slate-100">{row.n}</span>
              <span className="ml-auto truncate text-[11px] text-slate-500">{row.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[rgba(17,24,39,0.85)] backdrop-blur-md">
        <div className="page flex h-16 items-center justify-between gap-4">
          <Brand tagline="Maternal & child health" />
          <div className="hidden items-center gap-1 md:flex">
            {[
              { href: "#audiences", label: "Who it's for" },
              { href: "#how", label: "How it works" },
            ].map(link => (
              <a key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup?role=mother">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="page grid gap-14 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pt-20">
        <div className="motion-rise max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-line)] bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            Continuous care from first kick to first steps
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[56px]">
            The care between <span className="text-[var(--primary)]">clinic visits.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
            Mothers complete a 60-second daily check-in. Doctors see linked patients on a live triage board, with urgent cases surfaced first.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup?role=mother">
              <Button size="lg" className="w-full sm:w-auto">
                I&apos;m a mother <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup?role=doctor">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Stethoscope className="h-4 w-4" /> I&apos;m a clinician
              </Button>
            </Link>
          </div>

          <ul className="mt-8 grid gap-2.5 text-sm text-slate-300 sm:grid-cols-3">
            {["60-second check-ins", "Real-time doctor alerts", "One-code doctor linking"].map(item => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="motion-rise">
          <ProductPreview />
        </div>
      </header>

      {/* Capability strip */}
      <section className="border-y border-[var(--hairline)] bg-[var(--surface-sunken)]">
        <div className="page flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-6">
          {capabilities.map(item => {
            const Icon = item.icon
            return (
              <span key={item.label} className="flex items-center gap-2 text-sm text-slate-400">
                <Icon className="h-4 w-4 text-slate-500" />
                {item.label}
              </span>
            )
          })}
        </div>
      </section>

      {/* Audiences */}
      <section id="audiences" className="page scroll-mt-20 py-20">
        <div className="max-w-2xl">
          <p className="eyebrow text-[var(--primary)]">Two sides, one record</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Built for mothers and the clinicians who care for them</h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {audiences.map(audience => {
            const Icon = audience.icon
            return (
              <div key={audience.title} className="surface flex flex-col p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="eyebrow">{audience.eyebrow}</p>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{audience.title}</h3>
                <ul className="mt-5 space-y-3">
                  {audience.points.map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-7">
                  <Link href={audience.cta.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:text-orange-300">
                    {audience.cta.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-[var(--hairline)]">
        <div className="page py-20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow text-[var(--primary)]">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Up and running in minutes</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
              No hardware, no complex setup. A referral code is all it takes to connect mother and doctor.
            </p>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <li key={step.title} className="surface p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-slate-200 ring-1 ring-[var(--hairline)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="num text-sm font-semibold text-slate-600">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{step.body}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="page pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--primary-line)] bg-gradient-to-br from-[rgba(249,115,22,0.14)] via-[var(--card)] to-[var(--card)] p-8 sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Start your care path today</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Free to join. Choose your side and you&apos;ll land in the right experience.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?role=mother">
                <Button size="lg" className="w-full sm:w-auto">Join as a mother</Button>
              </Link>
              <Link href="/signup?role=doctor">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Join as a clinician <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MedicalFooter />
    </div>
  )
}
