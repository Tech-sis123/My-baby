import Image from "next/image"
import Link from "next/link"

const AUTH_IMAGE =
  "https://images.pexels.com/photos/19957214/pexels-photo-19957214.jpeg?auto=compress&cs=tinysrgb&w=1200"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-[rgba(255,248,239,0.12)] bg-[rgba(255,248,239,0.08)] shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left — full-bleed image panel */}
        <section className="relative hidden overflow-hidden lg:block">
          <Image
            src={AUTH_IMAGE}
            alt="Doctor on a telehealth call"
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(43,37,31,0.18),rgba(43,37,31,0.86))]" />

          <div className="relative flex h-full flex-col justify-between p-10">
            <Link href="/" className="inline-flex items-center gap-3 self-start">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,248,239,0.22)] bg-[rgba(255,248,239,0.12)] text-[10px] font-semibold tracking-[0.28em] text-[#fff3e2]">
                MB
              </span>
              <span className="font-display text-xl font-semibold text-white">My Baby</span>
            </Link>

            <div className="max-w-md">
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#f0d2b5]">
                Continuous care, Nigeria
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.08] text-white">
                The watch between clinic visits.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[rgba(255,255,255,0.7)]">
                Mothers check in daily. Doctors see red flags in real time. One invite code connects them — no wait, no missed signs.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { label: "60-second", sub: "daily check-in" },
                  { label: "Real-time", sub: "doctor alerts" },
                  { label: "One code", sub: "links everything" },
                ].map(item => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[rgba(255,248,239,0.14)] bg-[rgba(255,248,239,0.08)] px-3 py-3 backdrop-blur"
                  >
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-[rgba(255,255,255,0.6)]">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right — form */}
        <section className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  )
}
