"use client"

import { useAppStore } from "@/lib/progress-store"
import { RoleCard } from "@/components/role-card"

export function FeaturedRolesGrid() {
  const { roles } = useAppStore()
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map((role) => (
        <RoleCard key={role.slug} role={role} />
      ))}
    </div>
  )
}
