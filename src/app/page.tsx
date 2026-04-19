import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, BarChart3, MessageCircle, Shield } from "lucide-react"

export const metadata = {
  title: "My Baby — Maternal & Child Health",
  description: "Daily health tracking for pregnancy and early childhood, with real-time alerts for your doctor.",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👶</span>
          <span className="text-xl font-bold text-gray-900">My Baby</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup?role=mother">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Heart className="w-3.5 h-3.5" /> Built for Nigerian mothers
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Health tracking for pregnancy & your new baby
          </h1>

          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Log daily check-ins, get instant alerts on warning signs, and keep your doctor informed — all from your phone.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup?role=mother">
              <Button size="lg" className="w-full sm:w-auto px-8">
                🤰 I&apos;m a mother
              </Button>
            </Link>
            <Link href="/signup?role=doctor">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                👨‍⚕️ I&apos;m a doctor
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Features strip */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div>
            <Heart className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-semibold text-gray-800">Daily check-ins</p>
            <p className="text-xs text-gray-500 mt-0.5">60 seconds a day</p>
          </div>
          <div>
            <Shield className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-semibold text-gray-800">Automatic alerts</p>
            <p className="text-xs text-gray-500 mt-0.5">Rule-based triage</p>
          </div>
          <div>
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-semibold text-gray-800">Doctor dashboard</p>
            <p className="text-xs text-gray-500 mt-0.5">Realtime patient view</p>
          </div>
          <div>
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-semibold text-gray-800">AI assistant</p>
            <p className="text-xs text-gray-500 mt-0.5">Health Q&amp;A</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-6 py-5 text-center text-xs text-gray-400">
        My Baby · Built for Technovation Girls · For general guidance only — not a substitute for medical care
      </footer>
    </div>
  )
}
