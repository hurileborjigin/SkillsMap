"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Role } from "@/lib/types"
import { useProgress } from "@/lib/progress-store"
import { summarizeRole } from "@/lib/progress-utils"
import { countRoleSkills } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RoleIcon } from "@/components/role-icon"

interface Props {
  role: Role
}

const difficultyVariant = {
  Beginner: "success",
  Intermediate: "primary",
  Advanced: "default",
} as const

export function RoleCard({ role }: Props) {
  const { progress } = useProgress()
  const summary = summarizeRole(role, progress)
  const totalSkills = countRoleSkills(role)

  return (
    <Link
      href={`/roles/${role.slug}`}
      className="group relative flex flex-col gap-5 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-4">
        <RoleIcon iconKey={role.iconKey} size="md" />
        <ArrowRight className="size-4 text-muted-foreground transition-all group-hover:text-foreground group-hover:translate-x-0.5" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{role.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {role.shortDescription}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="muted">
          <span className="font-mono">{totalSkills}</span>
          <span>skills</span>
        </Badge>
        <Badge variant={difficultyVariant[role.difficulty]}>{role.difficulty}</Badge>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono text-foreground">{summary.percent}%</span>
        </div>
        <Progress
          value={summary.percent}
          indicatorClassName={summary.percent === 100 ? "bg-success" : "bg-primary"}
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            <span className="font-mono text-foreground">{summary.completed}</span> /{" "}
            <span className="font-mono">{summary.total}</span> completed
          </span>
          {summary.requiredTotal > 0 && (
            <span>
              Required:{" "}
              <span className="font-mono text-foreground">
                {summary.requiredCompleted}/{summary.requiredTotal}
              </span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
