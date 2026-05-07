import { RoleCard } from "@/components/role-card"
import { roles } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Roles — SkillGraph",
  description: "Browse all engineering roles and explore their skill trees.",
}

export default function RolesPage() {
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
          path from where you are to where you want to be.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.slug} role={role} />
        ))}
      </div>
    </div>
  )
}
