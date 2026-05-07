"use client"

import { useState } from "react"
import { Check, ChevronDown, ChevronRight, Circle, Loader } from "lucide-react"
import type { Skill, SkillStatus } from "@/lib/types"
import { useProgress } from "@/lib/progress-store"
import {
  countIncompleteDescendants,
  getEffectiveStatus,
  summarizeChildren,
} from "@/lib/progress-utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"

interface Props {
  skill: Skill
  trackId: string
  onSelect: (skill: Skill) => void
  /** Nesting depth — controls indentation on the left. 0 for top level. */
  depth?: number
}

const importanceLabel: Record<Skill["importance"], string> = {
  required: "Required",
  important: "Important",
  optional: "Optional",
}

const importanceClass: Record<Skill["importance"], string> = {
  required: "text-foreground",
  important: "text-muted-foreground",
  optional: "text-muted-foreground/70",
}

const importanceDot: Record<Skill["importance"], string> = {
  required: "bg-primary",
  important: "bg-muted-foreground",
  optional: "bg-muted-foreground/40",
}

const statusStyles: Record<SkillStatus, string> = {
  "not-started": "border-border bg-card text-muted-foreground hover:border-foreground/30",
  learning: "border-primary/40 bg-primary/5 text-foreground hover:border-primary/60",
  completed: "border-success/40 bg-success/5 text-foreground hover:border-success/60",
}

const checkBoxStyles: Record<SkillStatus, string> = {
  "not-started": "border-border text-transparent",
  learning: "border-primary bg-primary/15 text-primary",
  completed: "border-success bg-success text-success-foreground",
}

const STATUS_ORDER: SkillStatus[] = ["not-started", "learning", "completed"]

function nextStatus(s: SkillStatus): SkillStatus {
  return STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % STATUS_ORDER.length]
}

export function SkillNode({ skill, trackId, onSelect, depth = 0 }: Props) {
  const { getStatus, setStatus, setSkillTreeStatus } = useProgress()
  const hasChildren = !!skill.children && skill.children.length > 0

  // Effective status — what the user sees. Reflects "all children completed"
  // even if the parent's raw status hasn't been touched yet.
  const status = getEffectiveStatus(skill, trackId, getStatus)
  const [expanded, setExpanded] = useState(true)
  const childSummary = hasChildren ? summarizeChildren(skill, trackId, getStatus) : null

  const [confirmAction, setConfirmAction] = useState<null | "complete" | "reset">(null)
  const incompleteCount = hasChildren ? countIncompleteDescendants(skill, trackId, getStatus) : 0

  const handleCycle = () => {
    const target = nextStatus(status)

    if (!hasChildren) {
      setStatus(trackId, skill.id, target)
      return
    }

    // Going TO completed but children aren't all done → confirm + cascade.
    if (target === "completed" && incompleteCount > 0) {
      setConfirmAction("complete")
      return
    }

    // Currently displayed as completed (because children ARE all done) and
    // user wants to step back to not-started → confirm + cascade reset.
    if (status === "completed" && target === "not-started") {
      setConfirmAction("reset")
      return
    }

    // Transitioning between not-started/learning on a parent — touch only the
    // parent's own raw status. Children stay where they are.
    setStatus(trackId, skill.id, target)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-lg border p-3 pl-2.5 transition-all",
          statusStyles[status],
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            aria-label={expanded ? "Collapse sub-skills" : "Expand sub-skills"}
            aria-expanded={expanded}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        ) : (
          <span className="size-5 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleCycle()
          }}
          aria-label={`Cycle status for ${skill.name}. Currently ${status}.`}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            checkBoxStyles[status],
          )}
        >
          {status === "completed" ? (
            <Check className="size-3.5" strokeWidth={3} />
          ) : status === "learning" ? (
            <Loader className="size-3.5" />
          ) : (
            <Circle className="size-3 opacity-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelect(skill)}
          className="flex flex-1 items-center justify-between gap-3 text-left focus-visible:outline-none min-w-0"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className={cn(
                "text-sm font-medium leading-tight",
                status === "completed" && "text-foreground",
              )}
            >
              {skill.name}
            </span>
            <span className="flex items-center gap-2 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", importanceDot[skill.importance])} />
                <span className={importanceClass[skill.importance]}>
                  {importanceLabel[skill.importance]}
                </span>
              </span>
              {childSummary && (
                <span className="text-muted-foreground">
                  · {childSummary.completed}/{childSummary.total} sub-skills
                </span>
              )}
            </span>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {hasChildren && expanded && (
        <div
          className={cn(
            "flex flex-col gap-1.5 border-l border-border/60 pl-3",
            depth === 0 ? "ml-3" : "ml-2",
          )}
        >
          {skill.children!.map((child) => (
            <SkillNode
              key={child.id}
              skill={child}
              trackId={trackId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmAction(null)
        }}
        variant="default"
        title={
          confirmAction === "reset"
            ? `Reset progress for ${skill.name}?`
            : `Mark ${skill.name} as completed?`
        }
        description={
          confirmAction === "reset"
            ? `This will clear progress for ${skill.name} and all of its sub-skills.`
            : `${incompleteCount} sub-skill${incompleteCount === 1 ? "" : "s"} not yet completed. Marking this skill as completed will also mark every sub-skill as completed.`
        }
        confirmLabel={confirmAction === "reset" ? "Reset all" : "Mark all completed"}
        onConfirm={() => {
          if (confirmAction === "reset") {
            setSkillTreeStatus(trackId, skill, "not-started")
          } else if (confirmAction === "complete") {
            setSkillTreeStatus(trackId, skill, "completed")
          }
          setConfirmAction(null)
        }}
      />
    </div>
  )
}
