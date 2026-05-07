"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Network } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Home" },
  { href: "/roles", label: "Roles" },
  { href: "/progress", label: "My Progress" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-primary transition-colors group-hover:border-primary/50">
            <Network className="size-4" />
          </span>
          <span className="font-semibold tracking-tight text-foreground">SkillGraph</span>
          <span className="hidden sm:inline rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Beta
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/roles">Explore</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/roles">Get started</Link>
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 border-t border-border px-4 py-2 overflow-x-auto">
        {links.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
