import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MedicalFooter } from "@/components/medical-footer"
import {
  Activity,
  ArrowRight,
  Baby,
  BarChart3,
  BellRing,
  BriefcaseMedical,
  Clock3,
  Link2,
  MessageCircle,
  Shield,
  Sparkles,
  Stethoscope,
} from "lucide-react"

const MOTHER_IMAGE =
  "https://images.pexels.com/photos/35136012/pexels-photo-35136012.jpeg?auto=compress&cs=tinysrgb&w=1200"
const DOCTOR_IMAGE =
  "https://images.pexels.com/photos/19957220/pexels-photo-19957220.jpeg?auto=compress&cs=tinysrgb&w=1200"

const productStats = [
  { label: "Daily check-ins", value: "60 sec" },
  { label: "Triage priorities", value: "Red / Yellow / Green" },
  { label: "Referral connection", value: "Live doctor linking" },
  { label: "AI support", value: "Role-aware prompts" },
]

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

const platformPanels = [
  {
    title: "Responsive mother dashboard",
    body:
      "Quick tips, appointments, doctor linking, and care-mode-specific prompts in a layout that works better on desktop and mobile.",
    icon: Activity,
  },
  {
    title: "Live doctor triage board",
    body:
      "Doctors see urgency and recent updates first, with linked patients sorted by severity.",
    icon: BarChart3,
  },
  {
    title: "AI that respects role and context",
    body:
      "Mothers ask in everyday language. Doctors ask clinical questions. The product should keep that difference clear.",
    icon: MessageCircle,
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

      <section className="motion-rise mx-auto grid w-full max-w-7xl gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
        {productStats.map(stat => (
          <div
            key={stat.label}
            className="rounded-[1.35rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] px-4 py-4 backdrop-blur"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">{stat.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-16 pt-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-10 lg:pb-20 lg:pt-6">
        <section className="motion-rise max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(199,143,98,0.18)] bg-[rgba(199,143,98,0.08)] px-4 py-2 text-sm font-medium text-[#f0d2b5] backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Continuous care from first kick to first steps.
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[0.96] text-white sm:mt-8 sm:text-6xl xl:text-7xl">
            Pregnancy and baby care, with doctor follow-up that is easier to act on.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg sm:leading-8">
            Mothers check in from the right care path. Doctors see linked patients, fresh updates, and clear red, yellow, and green priorities.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup?role=mother">
              <Button
                size="lg"
                className="w-full bg-[var(--primary)] px-8 shadow-[0_18px_40px_rgba(199,143,98,0.24)] sm:w-auto"
              >
                For mothers
              </Button>
            </Link>
            <Link href="/signup?role=doctor">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.03)] px-8 text-white sm:w-auto"
              >
                For doctors
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="panel-float rounded-[1.9rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[#f0d2b5]">About</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Linked care with invite codes</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                Continuous care from first kick to first steps. Doctors can stay linked to several mothers and babies through invite codes, so updates from different accounts still flow back to one dashboard.
              </p>
            </div>

            <div className="rounded-[1.9rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">Product promise</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.2rem] border border-red-400/25 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-white">Red</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Immediate attention</p>
                </div>
                <div className="rounded-[1.2rem] border border-yellow-400/25 bg-yellow-500/10 p-4">
                  <p className="text-sm font-semibold text-white">Yellow</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Review soon</p>
                </div>
                <div className="rounded-[1.2rem] border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <p className="text-sm font-semibold text-white">Green</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Stable and monitored</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="motion-rise-delay grid gap-4">
          <div className="grid gap-4 md:grid-cols-[1.06fr_0.94fr]">
            <div className="panel-float relative overflow-hidden rounded-[2rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)]">
              <Image
                src={MOTHER_IMAGE}
                alt="African mother holding her baby indoors"
                width={1200}
                height={1600}
                className="photo-float h-[360px] w-full object-cover sm:h-[520px]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(14,15,19,0),rgba(14,15,19,0.88))] p-5">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[rgba(255,255,255,0.72)]">Mother experience</p>
                <p className="mt-2 text-xl font-semibold text-white">Context-aware daily care</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="panel-float relative overflow-hidden rounded-[2rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)]">
                <Image
                src={DOCTOR_IMAGE}
                alt="Black female doctor writing notes during a consultation"
                width={1200}
                height={1600}
                className="photo-float h-[220px] w-full object-cover sm:h-[252px]"
              />
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(14,15,19,0),rgba(14,15,19,0.86))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[rgba(255,255,255,0.72)]">Doctor view</p>
                  <p className="mt-2 text-lg font-semibold text-white">Responsive triage board</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.26em] text-[#f0d2b5]">Live product logic</p>
                  <BriefcaseMedical className="h-5 w-5 text-[#f0d2b5]" />
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">If she is pregnant</p>
                    <p className="mt-2 text-sm font-medium text-white">Tips, check-ins, and AI suggestions stay on pregnancy.</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">If she has a baby</p>
                    <p className="mt-2 text-sm font-medium text-white">Tips, check-ins, and AI suggestions should stay on baby care.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="motion-rise mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 xl:grid-cols-2">
          {featureColumns.map(column => {
            const Icon = column.icon
            return (
              <div
                key={column.title}
                className="rounded-[2rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-7 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(199,143,98,0.22)] bg-[rgba(199,143,98,0.08)]">
                    <Icon className="h-5 w-5 text-[#f0d2b5]" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#f0d2b5]">{column.eyebrow}</p>
                </div>
                <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight text-white">{column.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{column.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="motion-rise-delay mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-[2.25rem] border border-[rgba(255,248,239,0.14)] bg-[linear-gradient(135deg,rgba(255,248,239,0.08),rgba(201,139,88,0.08))] p-7 sm:p-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[#f0d2b5]">How it works</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight text-white">The product flow should feel obvious before people even sign in.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
              A simple flow: choose the right path, check in, and keep the doctor side updated.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {processSteps.map(step => (
              <div
                key={step.number}
                className="rounded-[1.7rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-6"
              >
                <p className="text-sm font-semibold tracking-[0.18em] text-[#f0d2b5]">{step.number}</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="motion-rise mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#f0d2b5]">Inside the platform</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-white">What you can do inside the product.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
            The platform is built for check-ins, follow-up, linking, and clearer doctor response.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {platformPanels.map(panel => {
            const Icon = panel.icon
            return (
              <div
                key={panel.title}
                className="rounded-[1.9rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-6 backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(199,143,98,0.22)] bg-[rgba(199,143,98,0.08)]">
                  <Icon className="h-5 w-5 text-[#f0d2b5]" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-white">{panel.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{panel.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="motion-rise-delay mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {/* <div className="rounded-[2rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-7 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-[#f0d2b5]">Why it feels better</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">
              The page now feels fuller without over-explaining itself.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
              The hierarchy is clearer, the sections breathe better, and the message is easier to understand quickly.
            </p>
          </div> */}

          <div className="grid gap-4 md:grid-cols-3">
            {reassuranceItems.map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] p-6 backdrop-blur"
                >
                  <Icon className="h-5 w-5 text-[#f0d2b5]" />
                  <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{item.body}</p>
                </div>
              )
            })}
          </div>
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

      <section className="mx-auto mb-4 grid w-full max-w-7xl grid-cols-2 gap-6 px-4 pb-8 sm:px-6 sm:pb-10 sm:grid-cols-4">
        <div>
          <Activity className="mx-auto mb-2 h-6 w-6 text-[#f0d2b5]" />
          <p className="text-sm font-semibold text-white">Daily check-ins</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">60 seconds a day</p>
        </div>
        <div>
          <Shield className="mx-auto mb-2 h-6 w-6 text-[#f0d2b5]" />
          <p className="text-sm font-semibold text-white">Automatic alerts</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Rule-based triage</p>
        </div>
        <div>
          <BarChart3 className="mx-auto mb-2 h-6 w-6 text-[#f0d2b5]" />
          <p className="text-sm font-semibold text-white">Doctor dashboard</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Realtime patient view</p>
        </div>
        <div>
          <MessageCircle className="mx-auto mb-2 h-6 w-6 text-[#f0d2b5]" />
          <p className="text-sm font-semibold text-white">AI assistant</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Health Q&amp;A</p>
        </div>
      </section>

      <MedicalFooter />
    </div>
  )
}
