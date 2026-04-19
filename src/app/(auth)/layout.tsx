import Image from "next/image"
import Link from "next/link"

const AUTH_IMAGE =
  "https://images.pexels.com/photos/19957214/pexels-photo-19957214.jpeg?auto=compress&cs=tinysrgb&w=1200"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-[rgba(255,248,239,0.12)] bg-[rgba(255,248,239,0.08)] shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <Image
            src={AUTH_IMAGE}
            alt="Black female doctor on a telehealth call"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="photo-float absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(76,61,48,0.12),rgba(48,39,32,0.8))]" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,248,239,0.2)] bg-[rgba(255,248,239,0.12)] text-xs font-semibold tracking-[0.28em] text-[#fff3e2]">
                  MB
                </span>
                <span className="font-display text-2xl font-semibold text-white">My Baby</span>
              </Link>
            </div>
            <div className="max-w-lg">
              <p className="text-xs uppercase tracking-[0.34em] text-[#fff0de]">Maternal care, upgraded</p>
              <h2 className="mt-4 font-display text-5xl font-semibold leading-[1] text-white">
                A calmer, more credible experience for mothers and doctors.
              </h2>
              <p className="mt-5 text-sm text-[rgba(255,255,255,0.72)]">
                Real clinical photography, better desktop structure, and clearer product hierarchy replace the old playful presentation.
              </p>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  )
}
