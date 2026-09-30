import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  title: "My Baby — Maternal & Child Health",
  description: "Your pregnancy and baby health companion",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#111827",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full overflow-x-hidden antialiased" suppressHydrationWarning>
        <div className="platform-shell flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  )
}
