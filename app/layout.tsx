import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ProgressProvider } from "@/lib/progress-store"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Navbar } from "@/components/navbar"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SkillGraph — Structured skill trees for modern engineering roles",
  description:
    "Understand what it takes to become hireable. SkillGraph maps the skills behind LLM, Backend, Frontend, DevOps, and Computer Vision roles — and helps you track real progress.",
  keywords: [
    "engineering roles",
    "skill tree",
    "learning roadmap",
    "junior engineer",
    "LLM engineer",
    "backend engineer",
  ],
}

export const viewport: Viewport = {
  themeColor: "#0b0d11",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground min-h-screen">
        <TooltipProvider delayDuration={150}>
          <ProgressProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          </ProgressProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
