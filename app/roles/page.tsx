"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { useAppStore } from "@/lib/progress-store"
import { RoleCard } from "@/components/role-card"
import { Badge } from "@/components/ui/badge"

export default function RolesPage() {
  const { roles } = useAppStore()
  const customCount = roles.filter((r) => !r.isDefault).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-3 max-w-3xl">
        <Badge variant="muted" className="self-start font-mono">
          Roles explorer
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Every role, broken down.
        </h1>
        <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
          Each role is a structured tree of categories and skills. Pick one and start mapping the
          path from where you are to where you want to be — or build your own.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {roles.length} {roles.length === 1 ? "role" : "roles"}
          {customCount > 0 && (
            <>
              {" · "}
              <span className="text-foreground">{customCount}</span> custom
            </>
          )}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.slug} role={role} />
        ))}
        <Link
          href="/roles/new"
          className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 p-5 text-center transition-colors hover:border-primary/50 hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-primary transition-colors group-hover:border-primary/40">
            <Plus className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold tracking-tight">Create a new role</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Define your own engineering track with categories and skills tailored to you.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
