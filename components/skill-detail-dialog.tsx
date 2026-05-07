"use client"

import { useState } from "react"
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useProgress } from "@/lib/progress-store"
import { countIncompleteDescendants, getEffectiveStatus } from "@/lib/progress-utils"
import type { Skill, SkillStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  skill: Skill | null
  trackId: string
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

export function SkillDetailDialog({ skill, trackId, allSkills, onOpenChange, onSelectRelated }: Props) {
  const { getStatus, setStatus, setSkillTreeStatus } = useProgress()
  const [pendingTarget, setPendingTarget] = useState<null | { value: SkillStatus; mode: "complete" | "reset" }>(null)
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

  const hasChildren = !!skill.children && skill.children.length > 0
  const status = getEffectiveStatus(skill, trackId, getStatus)
  const incompleteCount = hasChildren ? countIncompleteDescendants(skill, trackId, getStatus) : 0
  const related =
    skill.related?.map((id) => allSkills.find((s) => s.id === id)).filter(Boolean) as Skill[]

  const handleStatusClick = (target: SkillStatus) => {
    if (target === status) return

    if (!hasChildren) {
      setStatus(trackId, skill.id, target)
      return
    }

    // Cascade-with-confirm: marking a parent completed without all children done.
    if (target === "completed" && incompleteCount > 0) {
      setPendingTarget({ value: "completed", mode: "complete" })
      return
    }

    // Cascade-with-confirm: resetting a parent that's currently completed.
    if (status === "completed" && target === "not-started") {
      setPendingTarget({ value: "not-started", mode: "reset" })
      return
    }

    setStatus(trackId, skill.id, target)
  }

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

        {skill.whyItMatters && (
          <section className="flex flex-col gap-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Why it matters
            </h4>
            <p className="text-sm text-foreground leading-relaxed">{skill.whyItMatters}</p>
          </section>
        )}

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
                onClick={() => handleStatusClick(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </section>

        {skill.children && skill.children.length > 0 && (
          <section className="flex flex-col gap-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Sub-skills
            </h4>
            <ul className="flex flex-col gap-1">
              {skill.children.map((child) => {
                const childStatus = getEffectiveStatus(child, trackId, getStatus)
                return (
                  <li key={child.id}>
                    <button
                      onClick={() => onSelectRelated(child)}
                      className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            childStatus === "completed"
                              ? "bg-success"
                              : childStatus === "learning"
                                ? "bg-primary"
                                : "bg-muted-foreground/40",
                          )}
                        />
                        <span className="truncate text-sm font-medium">{child.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {child.importance}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

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

      <ConfirmDialog
        open={pendingTarget !== null}
        onOpenChange={(o) => {
          if (!o) setPendingTarget(null)
        }}
        variant="default"
        title={
          pendingTarget?.mode === "reset"
            ? `Reset progress for ${skill.name}?`
            : `Mark ${skill.name} as completed?`
        }
        description={
          pendingTarget?.mode === "reset"
            ? `This will clear progress for ${skill.name} and all of its sub-skills.`
            : `${incompleteCount} sub-skill${incompleteCount === 1 ? "" : "s"} not yet completed. Marking this skill as completed will also mark every sub-skill as completed.`
        }
        confirmLabel={pendingTarget?.mode === "reset" ? "Reset all" : "Mark all completed"}
        onConfirm={() => {
          if (pendingTarget) setSkillTreeStatus(trackId, skill, pendingTarget.value)
          setPendingTarget(null)
        }}
      />
    </Dialog>
  )
}
