"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, ChevronDown, GitBranch, Pencil, Plus } from "lucide-react"
import type { Role, Skill } from "@/lib/types"
import { useAppStore } from "@/lib/progress-store"
import { summarizeCategory, summarizeRole } from "@/lib/progress-utils"
import { getActiveTrack } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RoleIcon } from "@/components/role-icon"
import { SkillNode } from "@/components/skill-node"
import { SkillDetailDialog } from "@/components/skill-detail-dialog"
import { cn } from "@/lib/utils"

interface Props {
  role: Role
}

export function RoleDetailView({ role }: Props) {
  const { getStatus, setActiveTrack, createTrack } = useAppStore()
  const activeTrack = getActiveTrack(role)
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    activeTrack.categories[0]?.id ?? "",
  )
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const summary = useMemo(() => summarizeRole(role, getStatus), [role, getStatus])
  const allSkills = useMemo(
    () => activeTrack.categories.flatMap((c) => c.skills),
    [activeTrack],
  )

  const toggleCategory = (id: string) =>
    setCollapsedCategories((prev) => ({ ...prev, [id]: !prev[id] }))

  const scrollToCategory = (id: string) => {
    setActiveCategoryId(id)
    const el = document.getElementById(`category-${id}`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleAddTrack = () => {
    createTrack(role.slug, { name: "New Track", description: "An alternative path." })
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
      {/* Top breadcrumb / back */}
      <div className="flex items-center justify-between gap-3 py-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/roles">
            <ArrowLeft />
            All roles
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{role.slug}</span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/roles/${role.slug}/edit`}>
              <Pencil />
              Customize
            </Link>
          </Button>
        </div>
      </div>

      {/* Track tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/40 p-2">
        <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <GitBranch className="size-3.5" />
          Track
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
              </button>
            )
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground hover:text-foreground"
          onClick={handleAddTrack}
        >
          <Plus />
          New track
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Left sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <RoleIcon iconKey={role.iconKey} size="lg" />
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight leading-tight">
                  {role.name}
                </h1>
                <Badge variant="muted" className="self-start">
                  {role.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {role.shortDescription || "No description yet — open the editor to add one."}
              </p>
            </div>

            {/* Overall progress card */}
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {activeTrack.name}
                </span>
                <span className="font-mono text-sm text-foreground">{summary.percent}%</span>
              </div>
              <Progress
                value={summary.percent}
                indicatorClassName={summary.percent === 100 ? "bg-success" : "bg-primary"}
              />
              <dl className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd className="font-mono text-foreground">
                    {summary.completed}/{summary.total}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Required</dt>
                  <dd className="font-mono text-foreground">
                    {summary.requiredCompleted}/{summary.requiredTotal}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Categories nav */}
            {activeTrack.categories.length > 0 ? (
              <nav className="flex flex-col gap-1">
                <span className="px-2 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Categories
                </span>
                {activeTrack.categories.map((cat) => {
                  const cs = summarizeCategory(cat, activeTrack.id, getStatus)
                  const isActive = activeCategoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={cn(
                        "group flex flex-col gap-1.5 rounded-md px-2.5 py-2 text-left transition-colors",
                        isActive ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {cat.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {cs.completed}/{cs.total}
                        </span>
                      </div>
                      <Progress
                        value={cs.percent}
                        className="h-1"
                        indicatorClassName={cs.percent === 100 ? "bg-success" : "bg-primary"}
                      />
                    </button>
                  )
                })}
              </nav>
            ) : null}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-col gap-8 pb-16">
          {/* Header */}
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="font-mono">
                Skill tree
              </Badge>
              <Badge variant="muted">
                <span className="font-mono">{summary.total}</span> skills
              </Badge>
              <Badge variant="muted">
                <span className="font-mono">{activeTrack.categories.length}</span> categories
              </Badge>
            </div>
            <p className="text-pretty text-base text-muted-foreground leading-relaxed max-w-3xl">
              {role.longDescription ||
                activeTrack.description ||
                "No long-form description yet."}
            </p>
          </header>

          {/* Empty state for tracks with no categories */}
          {activeTrack.categories.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-card/30 p-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight">This track is empty</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Open the editor to add categories and skills, or duplicate another track to use
                  it as a starting point.
                </p>
              </div>
              <Button asChild>
                <Link href={`/roles/${role.slug}/edit`}>
                  <Pencil />
                  Open editor
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {activeTrack.categories.map((cat) => {
                const cs = summarizeCategory(cat, activeTrack.id, getStatus)
                const collapsed = collapsedCategories[cat.id]
                return (
                  <section
                    key={cat.id}
                    id={`category-${cat.id}`}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-card/50 p-5 scroll-mt-20"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="flex items-center gap-2 text-left"
                        aria-expanded={!collapsed}
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            collapsed && "-rotate-90",
                          )}
                        />
                        <h2 className="text-lg font-semibold tracking-tight">{cat.name}</h2>
                        <Badge variant="muted" className="font-mono">
                          {cs.completed}/{cs.total}
                        </Badge>
                      </button>
                      <div className="flex flex-col items-stretch gap-1.5 sm:items-end sm:min-w-[160px]">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-mono">{cs.percent}%</span>
                        </div>
                        <Progress
                          value={cs.percent}
                          className="h-1.5 sm:w-40"
                          indicatorClassName={cs.percent === 100 ? "bg-success" : "bg-primary"}
                        />
                      </div>
                    </div>

                    {cat.description && !collapsed && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {cat.description}
                      </p>
                    )}

                    {!collapsed && cat.skills.length > 0 && (
                      <div className="grid gap-2 md:grid-cols-2">
                        {cat.skills.map((skill) => (
                          <SkillNode
                            key={skill.id}
                            skill={skill}
                            trackId={activeTrack.id}
                            onSelect={(s) => setActiveSkill(s)}
                          />
                        ))}
                      </div>
                    )}

                    {!collapsed && cat.skills.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No skills in this category yet.
                      </p>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <SkillDetailDialog
        skill={activeSkill}
        trackId={activeTrack.id}
        allSkills={allSkills}
        onOpenChange={(open) => !open && setActiveSkill(null)}
        onSelectRelated={(s) => setActiveSkill(s)}
      />
    </div>
  )
}
