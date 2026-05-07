"use client"

import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Check,
  Copy,
  GitBranch,
  Plus,
  Trash2,
} from "lucide-react"
import { useAppStore } from "@/lib/progress-store"
import { getActiveTrack } from "@/lib/data"
import type { Difficulty, IconKey } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { IconPicker } from "@/components/icon-picker"
import { CategoryEditor } from "@/components/category-editor"
import { cn } from "@/lib/utils"

const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"]

export default function EditRolePage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const {
    roles,
    updateRole,
    deleteRole,
    setActiveTrack,
    createTrack,
    duplicateTrack,
    updateTrack,
    deleteTrack,
    addCategory,
  } = useAppStore()

  const role = roles.find((r) => r.slug === slug)
  const activeTrack = role ? getActiveTrack(role) : undefined

  // Confirmations
  const [confirmDeleteRole, setConfirmDeleteRole] = useState(false)
  const [confirmDeleteTrack, setConfirmDeleteTrack] = useState(false)

  // Allow editing the active track's name/description without losing focus
  // every keystroke. We mirror state locally and push to the store on blur
  // for the description (the store update on every change for name is fine
  // because we don't auto-scroll on it).
  const [trackNameDraft, setTrackNameDraft] = useState("")
  const [trackDescDraft, setTrackDescDraft] = useState("")

  useEffect(() => {
    if (activeTrack) {
      setTrackNameDraft(activeTrack.name)
      setTrackDescDraft(activeTrack.description ?? "")
    }
  }, [activeTrack?.id])

  const trackSkills = useMemo(
    () => (activeTrack ? activeTrack.categories.flatMap((c) => c.skills) : []),
    [activeTrack],
  )

  if (!role || !activeTrack) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Role not found</h1>
        <p className="mt-2 text-muted-foreground">
          The role &quot;{slug}&quot; doesn&apos;t exist (or hasn&apos;t loaded yet).
        </p>
        <Button asChild className="mt-6">
          <Link href="/roles">Back to roles</Link>
        </Button>
      </div>
    )
  }

  const handleDeleteRole = () => {
    deleteRole(role.slug)
    router.push("/roles")
  }

  const handleDeleteTrack = () => {
    deleteTrack(role.slug, activeTrack.id)
  }

  const canDeleteTrack = role.tracks.length > 1

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/roles/${role.slug}`}>
            <ArrowLeft />
            Back to role
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            {role.slug}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/roles/${role.slug}`}>
              <Check />
              Done
            </Link>
          </Button>
        </div>
      </div>

      <header className="mt-4 flex flex-col gap-2">
        <Badge variant="primary" className="self-start font-mono">
          Editor
        </Badge>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">
          Customize {role.name}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Edit role details, manage alternative tracks, and shape the skill hierarchy. All
          changes save instantly.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ------- Left: Role meta ------- */}
        <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Role details
            </h2>

            <div className="flex flex-col gap-2">
              <Label>Icon</Label>
              <IconPicker
                value={role.iconKey}
                onChange={(iconKey: IconKey) => updateRole(role.slug, { iconKey })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role-name">Name</Label>
              <Input
                id="edit-role-name"
                value={role.name}
                onChange={(e) => updateRole(role.slug, { name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role-short">Short description</Label>
              <Input
                id="edit-role-short"
                value={role.shortDescription}
                onChange={(e) => updateRole(role.slug, { shortDescription: e.target.value })}
                placeholder="One sentence for the role card."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role-long">Long description</Label>
              <Textarea
                id="edit-role-long"
                rows={4}
                value={role.longDescription}
                onChange={(e) => updateRole(role.slug, { longDescription: e.target.value })}
                placeholder="Shown at the top of the role page."
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Difficulty</Label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateRole(role.slug, { difficulty: opt })}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      role.difficulty === opt
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={role.difficulty === opt}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Danger zone
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteRole(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
                Delete role
              </Button>
            </div>
          </div>
        </aside>

        {/* ------- Right: Tracks + categories ------- */}
        <div className="flex flex-col gap-6 pb-16">
          {/* Track tab strip */}
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ml-1 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <GitBranch className="size-3.5" />
                Tracks
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {role.tracks.map((track) => {
                  const isActive = track.id === role.activeTrackId
                  return (
                    <button
                      key={track.id}
                      onClick={() => setActiveTrack(role.slug, track.id)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      {track.name}
                      {track.isDefault && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          default
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateTrack(role.slug, activeTrack.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => createTrack(role.slug, { name: "New Track" })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus />
                  New track
                </Button>
              </div>
            </div>

            {/* Active track meta */}
            <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={trackNameDraft}
                  onChange={(e) => {
                    setTrackNameDraft(e.target.value)
                    updateTrack(role.slug, activeTrack.id, { name: e.target.value })
                  }}
                  placeholder="Track name"
                  className="font-medium"
                  aria-label="Track name"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteTrack(true)}
                  disabled={!canDeleteTrack}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete track"
                  title={
                    canDeleteTrack
                      ? "Delete this track"
                      : "Can't delete the only track for this role"
                  }
                >
                  <Trash2 />
                  Delete track
                </Button>
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  value={trackDescDraft}
                  onChange={(e) => {
                    setTrackDescDraft(e.target.value)
                    updateTrack(role.slug, activeTrack.id, { description: e.target.value })
                  }}
                  placeholder="Describe what makes this track different (optional)."
                  rows={2}
                  className="resize-none text-sm text-muted-foreground"
                  aria-label="Track description"
                />
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                Categories &amp; skills
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {activeTrack.categories.length}{" "}
                {activeTrack.categories.length === 1 ? "category" : "categories"}
              </span>
            </div>

            {activeTrack.categories.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card/30 p-8">
                <h3 className="text-base font-semibold tracking-tight">No categories yet</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Categories group related skills. Add your first one to start shaping this
                  track.
                </p>
                <Button onClick={() => addCategory(role.slug, activeTrack.id, { name: "New category" })}>
                  <Plus />
                  Add category
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeTrack.categories.map((cat, i) => (
                  <CategoryEditor
                    key={cat.id}
                    role={role}
                    track={activeTrack}
                    category={cat}
                    index={i}
                    total={activeTrack.categories.length}
                    trackSkills={trackSkills}
                  />
                ))}
                <Button
                  variant="outline"
                  className="self-start"
                  onClick={() => addCategory(role.slug, activeTrack.id, { name: "New category" })}
                >
                  <Plus />
                  Add category
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Confirmations */}
      <ConfirmDialog
        open={confirmDeleteRole}
        onOpenChange={setConfirmDeleteRole}
        title="Delete this role?"
        description={`"${role.name}" and all of its tracks, categories, skills, and progress will be removed.`}
        confirmLabel="Delete role"
        onConfirm={handleDeleteRole}
      />

      <ConfirmDialog
        open={confirmDeleteTrack}
        onOpenChange={setConfirmDeleteTrack}
        title="Delete this track?"
        description={`"${activeTrack.name}" and all of its categories, skills, and progress will be removed.`}
        confirmLabel="Delete track"
        onConfirm={handleDeleteTrack}
      />
    </div>
  )
}
