"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, CircleDot, Circle } from "lucide-react"
import { useAppStore } from "@/lib/progress-store"
import { summarizeRole } from "@/lib/progress-utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RoleIcon } from "@/components/role-icon"

export function ProgressOverview() {
  const { roles, getStatus } = useAppStore()

  const roleSummaries = roles.map((role) => ({
    role,
    summary: summarizeRole(role, getStatus),
  }))

  // Aggregate across all roles
  const totals = roleSummaries.reduce(
    (acc, { summary }) => {
      acc.total += summary.total
      acc.completed += summary.completed
      acc.learning += summary.learning
      acc.notStarted += summary.notStarted
      return acc
    },
    { total: 0, completed: 0, learning: 0, notStarted: 0 },
  )
  const overallPercent = totals.total === 0 ? 0 : Math.round((totals.completed / totals.total) * 100)

  return (
    <div className="flex flex-col gap-10">
      {/* Hero stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2 flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Overall progress
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight">{overallPercent}</span>
            <span className="text-2xl font-semibold text-muted-foreground">%</span>
          </div>
          <Progress
            value={overallPercent}
            className="h-2"
            indicatorClassName={overallPercent === 100 ? "bg-success" : "bg-primary"}
          />
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-foreground">{totals.completed}</span> of{" "}
            <span className="font-mono">{totals.total}</span> skills marked completed across all
            active tracks.
          </p>
        </div>

        <StatCard
          icon={<CheckCircle2 className="size-4 text-success" />}
          label="Completed"
          value={totals.completed}
          accent="success"
        />
        <StatCard
          icon={<CircleDot className="size-4 text-primary" />}
          label="Learning"
          value={totals.learning}
          accent="primary"
        />
      </section>

      {/* Per-role list */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">By role</h2>
          <span className="font-mono text-xs text-muted-foreground">
            {roleSummaries.length} roles
          </span>
        </div>
        <div className="grid gap-3">
          {roleSummaries.map(({ role, summary }) => (
            <Link
              key={role.slug}
              href={`/roles/${role.slug}`}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-card/80"
            >
              <RoleIcon iconKey={role.iconKey} size="md" />
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold tracking-tight">{role.name}</h3>
                  <Badge variant="muted" className="font-mono">
                    {summary.completed}/{summary.total}
                  </Badge>
                  {summary.requiredTotal > 0 && (
                    <Badge variant="primary">
                      Required {summary.requiredCompleted}/{summary.requiredTotal}
                    </Badge>
                  )}
                  {role.tracks.length > 1 && (
                    <Badge variant="muted">{role.tracks.length} tracks</Badge>
                  )}
                </div>
                <Progress
                  value={summary.percent}
                  indicatorClassName={summary.percent === 100 ? "bg-success" : "bg-primary"}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-foreground">{summary.percent}%</span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Status legend */}
      <section className="rounded-xl border border-border bg-card/50 p-5">
        <h3 className="text-sm font-semibold tracking-tight">Status reference</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Click the checkbox on any skill to cycle between states.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-5 items-center justify-center rounded-md border border-border">
              <Circle className="size-2.5 text-transparent" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Not started</span>
              <span className="text-xs text-muted-foreground">
                You haven&apos;t begun this skill yet.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-5 items-center justify-center rounded-md border border-primary bg-primary/15 text-primary">
              <CircleDot className="size-3" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Learning</span>
              <span className="text-xs text-muted-foreground">
                You&apos;re actively working on it.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-5 items-center justify-center rounded-md border border-success bg-success text-success-foreground">
              <CheckCircle2 className="size-3" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Completed</span>
              <span className="text-xs text-muted-foreground">
                You feel comfortable applying it.
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: "success" | "primary"
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span
        className={
          accent === "success"
            ? "text-3xl font-semibold tracking-tight text-success"
            : "text-3xl font-semibold tracking-tight text-primary"
        }
      >
        {value}
      </span>
    </div>
  )
}
