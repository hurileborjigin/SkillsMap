"use client"

import { useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import type { Category, Role, Skill, Track } from "@/lib/types"
import { useAppStore, getSkillSiblingPosition } from "@/lib/progress-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SkillEditorDialog } from "@/components/skill-editor-dialog"
import { cn } from "@/lib/utils"

interface Props {
  role: Role
  track: Track
  category: Category
  index: number
  total: number
  /** All skills in the track (flattened, includes sub-skills) — used for the related-skills picker. */
  trackSkills: Skill[]
}

const importanceTone: Record<Skill["importance"], string> = {
  required: "text-primary border-primary/40 bg-primary/10",
  important: "text-foreground border-border bg-secondary",
  optional: "text-muted-foreground border-border bg-muted",
}

export function CategoryEditor({ role, track, category, index, total, trackSkills }: Props) {
  const {
    updateCategory,
    moveCategory,
    deleteCategory,
    addSkill,
    updateSkill,
    deleteSkill,
  } = useAppStore()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  /**
   * When non-null we're creating a skill. The value is the parent skill id to
   * nest the new skill under, or `null` to add at the top level of the
   * category. `undefined` means the dialog is closed.
   */
  const [creatingUnder, setCreatingUnder] = useState<string | null | undefined>(undefined)
  const [confirmDeleteSkill, setConfirmDeleteSkill] = useState<Skill | null>(null)

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card/50 p-5">
      {/* Category header */}
      <div className="flex items-start gap-3">
        <span className="mt-2 text-muted-foreground">
          <GripVertical className="size-4" />
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <Input
            value={category.name}
            onChange={(e) =>
              updateCategory(role.slug, track.id, category.id, { name: e.target.value })
            }
            className="h-9 border-transparent bg-transparent px-2 text-base font-semibold tracking-tight focus:border-border"
            placeholder="Category name"
            aria-label="Category name"
          />
          <Textarea
            value={category.description ?? ""}
            onChange={(e) =>
              updateCategory(role.slug, track.id, category.id, { description: e.target.value })
            }
            className="min-h-[40px] resize-none border-transparent bg-transparent px-2 text-sm text-muted-foreground focus:border-border"
            rows={2}
            placeholder="Optional description for this category…"
            aria-label="Category description"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => moveCategory(role.slug, track.id, category.id, -1)}
            disabled={index === 0}
            aria-label="Move category up"
          >
            <ArrowUp />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => moveCategory(role.slug, track.id, category.id, 1)}
            disabled={index === total - 1}
            aria-label="Move category down"
          >
            <ArrowDown />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete category"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* Skills tree */}
      <div className="flex flex-col gap-2 pl-7">
        {category.skills.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            No skills in this category yet.
          </p>
        )}
        {category.skills.map((skill) => (
          <SkillRow
            key={skill.id}
            role={role}
            track={track}
            categoryId={category.id}
            skill={skill}
            onEdit={(s) => setEditingSkill(s)}
            onAddChild={(parentId) => setCreatingUnder(parentId)}
            onDelete={(s) => setConfirmDeleteSkill(s)}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setCreatingUnder(null)}
        >
          <Plus />
          Add skill
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this category?"
        description={`"${category.name}" and every skill (and sub-skill) inside it will be removed from this track.`}
        confirmLabel="Delete"
        onConfirm={() => deleteCategory(role.slug, track.id, category.id)}
      />

      <SkillEditorDialog
        open={editingSkill !== null}
        initial={editingSkill}
        siblingSkills={trackSkills}
        onOpenChange={(open) => !open && setEditingSkill(null)}
        onSubmit={(input) => {
          if (editingSkill) {
            updateSkill(role.slug, track.id, category.id, editingSkill.id, input)
          }
        }}
      />

      <SkillEditorDialog
        open={creatingUnder !== undefined}
        initial={null}
        siblingSkills={trackSkills}
        onOpenChange={(open) => !open && setCreatingUnder(undefined)}
        onSubmit={(input) =>
          addSkill(role.slug, track.id, category.id, input, creatingUnder ?? null)
        }
      />

      <ConfirmDialog
        open={confirmDeleteSkill !== null}
        onOpenChange={(open) => !open && setConfirmDeleteSkill(null)}
        title="Delete this skill?"
        description={
          confirmDeleteSkill
            ? `"${confirmDeleteSkill.name}"${
                confirmDeleteSkill.children?.length
                  ? ` and its ${confirmDeleteSkill.children.length} sub-skill${
                      confirmDeleteSkill.children.length === 1 ? "" : "s"
                    }`
                  : ""
              } will be removed.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDeleteSkill) {
            deleteSkill(role.slug, track.id, category.id, confirmDeleteSkill.id)
          }
        }}
      />
    </section>
  )
}

// ---------------------------------------------------------------------------
// Recursive skill row — renders the skill plus, when expanded, its children.
// ---------------------------------------------------------------------------

interface SkillRowProps {
  role: Role
  track: Track
  categoryId: string
  skill: Skill
  onEdit: (s: Skill) => void
  onAddChild: (parentId: string) => void
  onDelete: (s: Skill) => void
}

function SkillRow({ role, track, categoryId, skill, onEdit, onAddChild, onDelete }: SkillRowProps) {
  const { roles, moveSkill } = useAppStore()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = !!skill.children && skill.children.length > 0

  // Look up the live category from the store so sibling positions reflect the
  // latest tree (so up/down disable correctly after a move).
  const liveCategory =
    roles
      .find((r) => r.slug === role.slug)
      ?.tracks.find((t) => t.id === track.id)
      ?.categories.find((c) => c.id === categoryId) ?? null

  const pos = liveCategory
    ? getSkillSiblingPosition(liveCategory.skills, skill.id) ?? { isFirst: true, isLast: true }
    : { isFirst: true, isLast: true }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
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

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide",
              importanceTone[skill.importance],
            )}
          >
            {skill.importance}
          </span>
          <span className="truncate text-sm font-medium">{skill.name}</span>
          {hasChildren && (
            <Badge variant="muted" className="font-mono">
              {skill.children!.length} sub-skill{skill.children!.length === 1 ? "" : "s"}
            </Badge>
          )}
          {skill.related && skill.related.length > 0 && (
            <Badge variant="muted" className="font-mono">
              {skill.related.length} linked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => moveSkill(role.slug, track.id, categoryId, skill.id, -1)}
            disabled={pos.isFirst}
            aria-label="Move skill up"
          >
            <ArrowUp />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => moveSkill(role.slug, track.id, categoryId, skill.id, 1)}
            disabled={pos.isLast}
            aria-label="Move skill down"
          >
            <ArrowDown />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onAddChild(skill.id)}
            aria-label="Add sub-skill"
            title="Add sub-skill"
          >
            <Plus />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(skill)}
            aria-label="Edit skill"
          >
            <Pencil />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(skill)}
            aria-label="Delete skill"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="flex flex-col gap-1.5 border-l border-border/60 pl-3 ml-3">
          {skill.children!.map((child) => (
            <SkillRow
              key={child.id}
              role={role}
              track={track}
              categoryId={categoryId}
              skill={child}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
