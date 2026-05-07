"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react"
import type { Category, Role, Skill, Track } from "@/lib/types"
import { useAppStore } from "@/lib/progress-store"
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
  /** All skills in the track — used for "related skills" picker. */
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
    moveSkill,
  } = useAppStore()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [creatingSkill, setCreatingSkill] = useState(false)
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

      {/* Skills */}
      <div className="flex flex-col gap-2 pl-7">
        {category.skills.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            No skills in this category yet.
          </p>
        )}
        {category.skills.map((skill, sIndex) => (
          <div
            key={skill.id}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
          >
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
                onClick={() => moveSkill(role.slug, track.id, category.id, skill.id, -1)}
                disabled={sIndex === 0}
                aria-label="Move skill up"
              >
                <ArrowUp />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => moveSkill(role.slug, track.id, category.id, skill.id, 1)}
                disabled={sIndex === category.skills.length - 1}
                aria-label="Move skill down"
              >
                <ArrowDown />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingSkill(skill)}
                aria-label="Edit skill"
              >
                <Pencil />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setConfirmDeleteSkill(skill)}
                aria-label="Delete skill"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setCreatingSkill(true)}
        >
          <Plus />
          Add skill
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this category?"
        description={`"${category.name}" and its ${category.skills.length} skill${
          category.skills.length === 1 ? "" : "s"
        } will be removed from this track.`}
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
        open={creatingSkill}
        initial={null}
        siblingSkills={trackSkills}
        onOpenChange={setCreatingSkill}
        onSubmit={(input) => addSkill(role.slug, track.id, category.id, input)}
      />

      <ConfirmDialog
        open={confirmDeleteSkill !== null}
        onOpenChange={(open) => !open && setConfirmDeleteSkill(null)}
        title="Delete this skill?"
        description={confirmDeleteSkill ? `"${confirmDeleteSkill.name}" will be removed.` : ""}
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
