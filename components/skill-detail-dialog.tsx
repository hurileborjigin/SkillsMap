"use client"

import { ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProgress } from "@/lib/progress-store"
import type { Skill, SkillStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  skill: Skill | null
  allSkills: Skill[]
  onOpenChange: (open: boolean) => void
  onSelectRelated: (skill: Skill) => void
}

const statusOptions: { value: SkillStatus; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "learning", label: "Learning" },
  { value: "completed", label: "Completed" },
]

const importanceVariant = {
  required: "primary",
  important: "default",
  optional: "muted",
} as const

export function SkillDetailDialog({ skill, allSkills, onOpenChange, onSelectRelated }: Props) {
  const { getStatus, setStatus } = useProgress()
  const open = skill !== null

  if (!skill) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent className="sr-only">
          <DialogTitle>Skill</DialogTitle>
        </DialogContent>
      </Dialog>
    )
  }

  const status = getStatus(skill.id, skill.status)
  const related =
    skill.related?.map((id) => allSkills.find((s) => s.id === id)).filter(Boolean) as Skill[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={importanceVariant[skill.importance]}>
              {skill.importance.charAt(0).toUpperCase() + skill.importance.slice(1)}
            </Badge>
            <Badge variant="muted" className="font-mono">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  status === "completed"
                    ? "bg-success"
                    : status === "learning"
                      ? "bg-primary"
                      : "bg-muted-foreground/50",
                )}
              />
              {statusOptions.find((s) => s.value === status)?.label}
            </Badge>
          </div>
          <DialogTitle className="mt-2 text-xl">{skill.name}</DialogTitle>
          <DialogDescription>{skill.description}</DialogDescription>
        </DialogHeader>

        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Why it matters
          </h4>
          <p className="text-sm text-foreground leading-relaxed">{skill.whyItMatters}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Status
          </h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={status === opt.value ? "default" : "outline"}
                onClick={() => setStatus(skill.id, opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </section>

        {related && related.length > 0 && (
          <section className="flex flex-col gap-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Related skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {related.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => onSelectRelated(rel)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  {rel.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {skill.resources && skill.resources.length > 0 && (
          <section className="flex flex-col gap-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Resources
            </h4>
            <ul className="flex flex-col gap-1">
              {skill.resources.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    {r.label}
                    <ExternalLink className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </DialogContent>
    </Dialog>
  )
}
