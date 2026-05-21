import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MedicalFooter } from "@/components/medical-footer"
import {
  ArrowRight,
  Baby,
  BellRing,
  Clock3,
  Link2,
  Sparkles,
  Stethoscope,
} from "lucide-react"

const MOTHER_IMAGE =
  "https://images.pexels.com/photos/35136012/pexels-photo-35136012.jpeg?auto=compress&cs=tinysrgb&w=1200"

const featureColumns = [
  {
    eyebrow: "For mothers",
    title: "Pregnancy and baby care stay in the right lane.",
    body:
      "If a mother is pregnant, the app stays on pregnancy. If she has a baby, it stays on baby care.",
    icon: Baby,
  },
  {
    eyebrow: "For doctors",
    title: "Doctors get a proper triage view.",
    body:
      "Linked patients appear on a live board, urgency is flagged, and invite codes connect several mother accounts back to one doctor.",
    icon: Stethoscope,
  },
]

const processSteps = [
  {
    number: "01",
    title: "Choose the right care path",
    body:
      "Start as pregnant, have a baby, or both. That choice shapes what the product shows next.",
  },
  {
    number: "02",
    title: "Check in and stay linked",
    body:
      "Mothers add updates and can attach a doctor's referral code so check-ins appear on the doctor's side.",
  },
  {
    number: "03",
    title: "Prioritize what matters",
    body:
      "Doctors see red first, yellow next, and stable cases after that.",
  },
]

const reassuranceItems = [
  {
    title: "Referral-code onboarding",
    body: "A doctor can generate a unique code and mothers can attach themselves to it from their own accounts.",
    icon: Link2,
  },
  {
    title: "Fast follow-up loops",
    body: "Check-ins, alerts, appointments, and pre-visit briefs are all placed where they can be acted on quickly.",
    icon: Clock3,
  },
  {
    title: "Signal over noise",
    body: "A quieter visual system makes the experience feel credible and lets high-priority information stand out.",
    icon: BellRing,
  },
]

export const metadata = {
  title: "My Baby — Maternal & Child Health",
  description: "Daily health tracking for pregnancy and early childhood, with real-time alerts for your doctor.",
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="flex items-center gap-3 self-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-sm font-semibold tracking-[0.28em] text-[#f0d2b5]">
            MB
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-white">My Baby</p>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted-foreground)]">Maternal care platform</p>
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
          <Link href="/signup?role=mother">
            <Button size="sm" className="w-full bg-[var(--primary)] shadow-[0_18px_40px_rgba(199,143,98,0.24)] sm:w-auto">
              Get started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-16 pt-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10 lg:pb-20 lg:pt-6">
        <section className="motion-rise max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(199,143,98,0.18)] bg-[rgba(199,143,98,0.08)] px-4 py-2 text-sm font-medium text-[#f0d2b5] backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Continuous care from first kick to first steps.
          </div>

          <h1 className="mt-6 font-display text-3xl font-semibold leading-[1.05] text-white sm:mt-8 sm:text-4xl xl:text-5xl">
            Pregnancy and baby care, with doctor follow-up that is easier to act on.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg sm:leading-8">
            Mothers check in from the right care path. Doctors see linked patients, fresh updates, and clear red, yellow, and green priorities.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup?role=mother">
              <Button
                size="lg"
                className="bg-[var(--primary)] px-8 shadow-[0_18px_40px_rgba(199,143,98,0.24)]"
              >
                For mothers
              </Button>
            </Link>
            <Link href="/signup?role=doctor">
              <Button
                size="lg"
                variant="outline"
                className="border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.03)] px-8 text-white"
              >
                For doctors
              </Button>
            </Link>
          </div>
        </section>

        <section className="motion-rise-delay">
          <div className="panel-float relative overflow-hidden rounded-[2rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)]">
            <Image
              src={MOTHER_IMAGE}
              alt="African mother holding her baby indoors"
              width={1200}
              height={1600}
              className="photo-float h-[280px] w-full object-cover object-[center_15%] sm:h-[420px]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(14,15,19,0),rgba(14,15,19,0.88))] p-5">
              <p className="text-[11px] uppercase tracking-[0.26em] text-[rgba(255,255,255,0.72)]">Mother experience</p>
              <p className="mt-2 text-xl font-semibold text-white">Context-aware daily care</p>
            </div>
          </div>
        </section>
      </main>

      <section className="mx-auto max-w-2xl px-4 pb-10 pt-4 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f0d2b5]">About</p>
        <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Linked care with invite codes</h2>
        <p className="mt-5 text-sm leading-7 text-[var(--muted-foreground)]">
          Continuous care from first kick to first steps. Doctors can stay linked to several mothers and babies through invite codes, so updates from different accounts still flow back to one dashboard.
        </p>
      </section>

      <section className="motion-rise mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-3 xl:grid-cols-2">
          {featureColumns.map(column => {
            const Icon = column.icon
            return (
              <div
                key={column.title}
                className="rounded-[1.5rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-5 backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(199,143,98,0.22)] bg-[rgba(199,143,98,0.08)]">
                    <Icon className="h-4 w-4 text-[#f0d2b5]" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#f0d2b5]">{column.eyebrow}</p>
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-tight text-white">{column.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{column.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="motion-rise-delay mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-[1.75rem] border border-[rgba(255,248,239,0.14)] bg-[linear-gradient(135deg,rgba(255,248,239,0.08),rgba(201,139,88,0.08))] p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[#f0d2b5]">How it works</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">The product flow should feel obvious before people even sign in.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
              A simple flow: choose the right path, check in, and keep the doctor side updated.
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {processSteps.map(step => (
              <div
                key={step.number}
                className="rounded-[1.3rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-6"
              >
                <p className="text-xs font-semibold tracking-[0.18em] text-[#f0d2b5]">{step.number}</p>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="motion-rise-delay mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {reassuranceItems.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-[1.8rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-8 backdrop-blur"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(199,143,98,0.22)] bg-[rgba(199,143,98,0.08)]">
                  <Icon className="h-5 w-5 text-[#f0d2b5]" />
                </div>
                <h3 className="mt-8 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">{item.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="motion-rise mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-[2.3rem] border border-[rgba(255,248,239,0.16)] bg-[linear-gradient(140deg,rgba(201,139,88,0.16),rgba(255,248,239,0.08))] p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[#f0d2b5]">Start with the right role</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight text-white">
                Join as a mother or doctor and enter the product from the correct side.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[rgba(255,255,255,0.72)]">
                Start from the side that matches you and move into the right experience.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?role=mother">
                <Button size="lg" className="w-full bg-[var(--primary)] sm:w-auto">
                  Create mother account
                </Button>
              </Link>
              <Link href="/signup?role=doctor">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.03)] text-white sm:w-auto"
                >
                  Create doctor account <ArrowRight className="h-4 w-4" />
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
