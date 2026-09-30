import Image from "next/image"
import { BellRing, ClipboardCheck, Link2 } from "lucide-react"
import { Brand } from "@/components/app/brand"

const AUTH_IMAGE =
  "https://images.pexels.com/photos/19957214/pexels-photo-19957214.jpeg?auto=compress&cs=tinysrgb&w=1200"

const points = [
  { icon: ClipboardCheck, title: "60-second check-ins", body: "Quick daily questions tuned to pregnancy or baby stage." },
  { icon: BellRing, title: "Real-time alerts", body: "Warning signs reach the linked doctor immediately." },
  { icon: Link2, title: "One referral code", body: "Connects every patient to the right clinician." },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr]">
      {/* Left — brand panel */}
      <section className="relative hidden overflow-hidden border-r border-[var(--hairline)] lg:block">
        <Image
          src={AUTH_IMAGE}
          alt="Doctor on a telehealth call"
          fill
          sizes="55vw"
          className="object-cover object-center opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/70 via-[#111827]/80 to-[#111827]" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Brand tagline="Maternal & child health" />

          <div className="max-w-md">
            <h2 className="text-3xl font-semibold leading-tight text-white xl:text-4xl">
              The watch between clinic visits.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
              Mothers check in daily. Doctors see red flags in real time. One code connects them.
            </p>

            <ul className="mt-10 space-y-5">
              {points.map(point => {
                const Icon = point.icon
                return (
                  <li key={point.title} className="flex gap-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--primary)] ring-1 ring-white/10">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{point.title}</p>
                      <p className="mt-0.5 text-[13px] text-slate-400">{point.body}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <p className="text-xs text-slate-500">Not an emergency service. In an emergency, go to the nearest hospital.</p>
        </div>
      </section>

      {/* Right — form */}
      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Brand tagline="Maternal & child health" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="motion-rise w-full max-w-[400px]">{children}</div>
        </div>
      </section>
    </main>
  )
}
