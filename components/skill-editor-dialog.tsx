"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Skill, SkillImportance } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, dialog edits this skill. When null, dialog creates a new skill. */
  initial: Skill | null
  /** Other skills in the same track, used for the related-skills picker. */
  siblingSkills: Skill[]
  onSubmit: (input: {
    name: string
    description: string
    whyItMatters: string
    importance: SkillImportance
    related: string[]
  }) => void
}

const IMPORTANCE: { value: SkillImportance; label: string; tone: string }[] = [
  { value: "required", label: "Required", tone: "bg-primary text-primary-foreground" },
  { value: "important", label: "Important", tone: "bg-secondary text-secondary-foreground" },
  { value: "optional", label: "Optional", tone: "bg-muted text-muted-foreground" },
]

export function SkillEditorDialog({ open, onOpenChange, initial, siblingSkills, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [whyItMatters, setWhyItMatters] = useState("")
  const [importance, setImportance] = useState<SkillImportance>("important")
  const [related, setRelated] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? "")
    setDescription(initial?.description ?? "")
    setWhyItMatters(initial?.whyItMatters ?? "")
    setImportance(initial?.importance ?? "important")
    setRelated(initial?.related ?? [])
  }, [open, initial])

  const isEdit = initial !== null
  const canSave = name.trim().length > 0
  // Prevent linking a skill to itself.
  const linkable = siblingSkills.filter((s) => s.id !== initial?.id)

  const toggleRelated = (id: string) => {
    setRelated((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submit = () => {
    if (!canSave) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      whyItMatters: whyItMatters.trim(),
      importance,
      related,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit skill" : "Add skill"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details for this skill." : "Add a new skill to this category."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="skill-name">Name</Label>
            <Input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vector Databases"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="skill-desc">Description</Label>
            <Textarea
              id="skill-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One short sentence about what this skill is."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="skill-why">Why it matters</Label>
            <Textarea
              id="skill-why"
              rows={3}
              value={whyItMatters}
              onChange={(e) => setWhyItMatters(e.target.value)}
              placeholder="Why does this matter on the job?"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Importance</Label>
            <div className="flex flex-wrap gap-2">
              {IMPORTANCE.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImportance(opt.value)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    importance === opt.value
                      ? cn("border-transparent", opt.tone)
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {linkable.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Related skills</Label>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-border bg-card p-2">
                {linkable.map((s) => {
                  const active = related.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleRelated(s.id)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        active
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave}>
            {isEdit ? "Save changes" : "Add skill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
