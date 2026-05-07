"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Network } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/progress-store"

const links = [
  { href: "/", label: "Home" },
  { href: "/roles", label: "Roles" },
  { href: "/progress", label: "My Progress" },
]

export function Navbar() {
  const pathname = usePathname()
  const { user } = useAppStore()
  const onAuthRoute = pathname.startsWith("/auth")

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

        {!onAuthRoute && (
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
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden md:inline max-w-[180px] truncate text-xs font-mono text-muted-foreground">
                {user.email}
              </span>
              <form action="/auth/sign-out" method="POST">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  aria-label="Sign out"
                  className="gap-2"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {!onAuthRoute && (
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
      )}
    </header>
  )
}
