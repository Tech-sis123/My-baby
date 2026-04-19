import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "My Baby — Maternal & Child Health",
  description: "Your pregnancy and baby health companion",
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full overflow-x-hidden antialiased">
        <div aria-hidden="true" className="platform-bubbles">
          <span className="platform-bubble bubble-a" />
          <span className="platform-bubble bubble-b" />
          <span className="platform-bubble bubble-c" />
          <span className="platform-bubble bubble-d" />
          <span className="platform-bubble bubble-e" />
          <span className="platform-bubble bubble-f" />
          <span className="platform-bubble bubble-g" />
        </div>
        <div className="platform-shell min-h-full flex flex-col">{children}</div>
      </body>
    </html>
  )
}
