"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { seedRoles, getActiveTrack } from "./data"
import { genId, uniqueSlug } from "./id"
import type {
  Category,
  IconKey,
  Role,
  Skill,
  SkillImportance,
  SkillStatus,
  Track,
} from "./types"

type ProgressMap = Record<string, SkillStatus>

const STATUS_ORDER: SkillStatus[] = ["not-started", "learning", "completed"]

function progressKey(trackId: string, skillId: string) {
  return `${trackId}:${skillId}`
}

/** Seed the progress map from any seed `status` fields the data ships with. */
function buildInitialProgress(roles: Role[]): ProgressMap {
  const map: ProgressMap = {}
  for (const role of roles) {
    for (const track of role.tracks) {
      for (const cat of track.categories) {
        for (const skill of cat.skills) {
          if (skill.status) map[progressKey(track.id, skill.id)] = skill.status
        }
      }
    }
  }
  return map
}

// ---------- pure helpers (immutable updates) ----------

function mapRole(roles: Role[], slug: string, fn: (r: Role) => Role): Role[] {
  return roles.map((r) => (r.slug === slug ? fn(r) : r))
}

function mapTrack(role: Role, trackId: string, fn: (t: Track) => Track): Role {
  return { ...role, tracks: role.tracks.map((t) => (t.id === trackId ? fn(t) : t)) }
}

function mapCategory(track: Track, categoryId: string, fn: (c: Category) => Category): Track {
  return {
    ...track,
    categories: track.categories.map((c) => (c.id === categoryId ? fn(c) : c)),
  }
}

function mapSkill(category: Category, skillId: string, fn: (s: Skill) => Skill): Category {
  return { ...category, skills: category.skills.map((s) => (s.id === skillId ? fn(s) : s)) }
}

function moveItem<T extends { id: string }>(items: T[], id: string, dir: -1 | 1): T[] {
  const i = items.findIndex((x) => x.id === id)
  if (i < 0) return items
  const j = i + dir
  if (j < 0 || j >= items.length) return items
  const next = items.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

// ---------- context ----------

export interface RoleInput {
  name: string
  shortDescription?: string
  longDescription?: string
  difficulty?: Role["difficulty"]
  iconKey?: IconKey
}

export interface SkillInput {
  name: string
  description?: string
  whyItMatters?: string
  importance?: SkillImportance
  related?: string[]
}

interface AppStoreValue {
  roles: Role[]

  // status helpers
  getStatus: (trackId: string, skillId: string, fallback?: SkillStatus) => SkillStatus
  setStatus: (trackId: string, skillId: string, status: SkillStatus) => void
  cycleStatus: (trackId: string, skillId: string) => void

  // role mutations
  createRole: (input: RoleInput) => Role
  updateRole: (slug: string, patch: Partial<Omit<Role, "slug" | "tracks" | "activeTrackId">>) => void
  deleteRole: (slug: string) => void

  // track mutations
  setActiveTrack: (slug: string, trackId: string) => void
  createTrack: (slug: string, input?: { name?: string; description?: string }) => Track | undefined
  duplicateTrack: (slug: string, trackId: string) => Track | undefined
  updateTrack: (slug: string, trackId: string, patch: Partial<Pick<Track, "name" | "description">>) => void
  deleteTrack: (slug: string, trackId: string) => void

  // category mutations
  addCategory: (slug: string, trackId: string, input?: { name?: string; description?: string }) => Category | undefined
  updateCategory: (
    slug: string,
    trackId: string,
    categoryId: string,
    patch: Partial<Pick<Category, "name" | "description">>,
  ) => void
  moveCategory: (slug: string, trackId: string, categoryId: string, dir: -1 | 1) => void
  deleteCategory: (slug: string, trackId: string, categoryId: string) => void

  // skill mutations
  addSkill: (
    slug: string,
    trackId: string,
    categoryId: string,
    input: SkillInput,
  ) => Skill | undefined
  updateSkill: (
    slug: string,
    trackId: string,
    categoryId: string,
    skillId: string,
    patch: Partial<Omit<Skill, "id">>,
  ) => void
  moveSkill: (
    slug: string,
    trackId: string,
    categoryId: string,
    skillId: string,
    dir: -1 | 1,
  ) => void
  deleteSkill: (slug: string, trackId: string, categoryId: string, skillId: string) => void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>(() => seedRoles)
  const [progress, setProgress] = useState<ProgressMap>(() => buildInitialProgress(seedRoles))

  // ----- progress -----
  const getStatus = useCallback(
    (trackId: string, skillId: string, fallback: SkillStatus = "not-started") =>
      progress[progressKey(trackId, skillId)] ?? fallback,
    [progress],
  )

  const setStatus = useCallback((trackId: string, skillId: string, status: SkillStatus) => {
    setProgress((prev) => ({ ...prev, [progressKey(trackId, skillId)]: status }))
  }, [])

  const cycleStatus = useCallback((trackId: string, skillId: string) => {
    setProgress((prev) => {
      const k = progressKey(trackId, skillId)
      const current = prev[k] ?? "not-started"
      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
      return { ...prev, [k]: next }
    })
  }, [])

  // ----- roles -----
  const createRole = useCallback<AppStoreValue["createRole"]>((input) => {
    const existing = roles.map((r) => r.slug)
    const slug = uniqueSlug(input.name, existing)
    const trackId = genId("track")
    const role: Role = {
      slug,
      name: input.name.trim() || "Untitled role",
      shortDescription: input.shortDescription?.trim() || "",
      longDescription: input.longDescription?.trim() || "",
      difficulty: input.difficulty ?? "Intermediate",
      iconKey: input.iconKey ?? "custom",
      tracks: [
        {
          id: trackId,
          name: "Default Track",
          description: "Your starting track. Add categories and skills below.",
          categories: [],
        },
      ],
      activeTrackId: trackId,
    }
    setRoles((prev) => [...prev, role])
    return role
  }, [roles])

  const updateRole = useCallback<AppStoreValue["updateRole"]>((slug, patch) => {
    setRoles((prev) => mapRole(prev, slug, (r) => ({ ...r, ...patch })))
  }, [])

  const deleteRole = useCallback<AppStoreValue["deleteRole"]>((slug) => {
    setRoles((prev) => {
      const target = prev.find((r) => r.slug === slug)
      if (!target) return prev
      // also clean up progress for any skill in any of the role's tracks
      setProgress((p) => {
        const next = { ...p }
        for (const t of target.tracks) {
          for (const c of t.categories) {
            for (const s of c.skills) delete next[progressKey(t.id, s.id)]
          }
        }
        return next
      })
      return prev.filter((r) => r.slug !== slug)
    })
  }, [])

  // ----- tracks -----
  const setActiveTrack = useCallback<AppStoreValue["setActiveTrack"]>((slug, trackId) => {
    setRoles((prev) =>
      mapRole(prev, slug, (r) => (r.tracks.some((t) => t.id === trackId) ? { ...r, activeTrackId: trackId } : r)),
    )
  }, [])

  const createTrack = useCallback<AppStoreValue["createTrack"]>((slug, input) => {
    const trackId = genId("track")
    const newTrack: Track = {
      id: trackId,
      name: input?.name?.trim() || "New Track",
      description: input?.description?.trim() || "An alternative path through this role.",
      categories: [],
    }
    setRoles((prev) =>
      mapRole(prev, slug, (r) => ({
        ...r,
        tracks: [...r.tracks, newTrack],
        activeTrackId: trackId,
      })),
    )
    return newTrack
  }, [])

  const duplicateTrack = useCallback<AppStoreValue["duplicateTrack"]>((slug, trackId) => {
    let created: Track | undefined
    setRoles((prev) =>
      mapRole(prev, slug, (r) => {
        const source = r.tracks.find((t) => t.id === trackId)
        if (!source) return r
        const newTrackId = genId("track")
        // give every nested category & skill a fresh id so progress can diverge per track
        const categories = source.categories.map<Category>((c) => ({
          ...c,
          id: genId("cat"),
          skills: c.skills.map<Skill>((s) => ({ ...s, id: genId("skill") })),
        }))
        const dup: Track = {
          id: newTrackId,
          name: `${source.name} (copy)`,
          description: source.description,
          categories,
        }
        created = dup
        return { ...r, tracks: [...r.tracks, dup], activeTrackId: newTrackId }
      }),
    )
    return created
  }, [])

  const updateTrack = useCallback<AppStoreValue["updateTrack"]>((slug, trackId, patch) => {
    setRoles((prev) => mapRole(prev, slug, (r) => mapTrack(r, trackId, (t) => ({ ...t, ...patch }))))
  }, [])

  const deleteTrack = useCallback<AppStoreValue["deleteTrack"]>((slug, trackId) => {
    setRoles((prev) =>
      mapRole(prev, slug, (r) => {
        if (r.tracks.length <= 1) return r // never delete the last track
        const remaining = r.tracks.filter((t) => t.id !== trackId)
        const removed = r.tracks.find((t) => t.id === trackId)
        if (removed) {
          setProgress((p) => {
            const next = { ...p }
            for (const c of removed.categories) {
              for (const s of c.skills) delete next[progressKey(removed.id, s.id)]
            }
            return next
          })
        }
        const activeTrackId = r.activeTrackId === trackId ? remaining[0].id : r.activeTrackId
        return { ...r, tracks: remaining, activeTrackId }
      }),
    )
  }, [])

  // ----- categories -----
  const addCategory = useCallback<AppStoreValue["addCategory"]>((slug, trackId, input) => {
    const cat: Category = {
      id: genId("cat"),
      name: input?.name?.trim() || "New category",
      description: input?.description,
      skills: [],
    }
    setRoles((prev) =>
      mapRole(prev, slug, (r) =>
        mapTrack(r, trackId, (t) => ({ ...t, categories: [...t.categories, cat] })),
      ),
    )
    return cat
  }, [])

  const updateCategory = useCallback<AppStoreValue["updateCategory"]>(
    (slug, trackId, categoryId, patch) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) => mapCategory(t, categoryId, (c) => ({ ...c, ...patch }))),
        ),
      )
    },
    [],
  )

  const moveCategory = useCallback<AppStoreValue["moveCategory"]>((slug, trackId, categoryId, dir) => {
    setRoles((prev) =>
      mapRole(prev, slug, (r) =>
        mapTrack(r, trackId, (t) => ({ ...t, categories: moveItem(t.categories, categoryId, dir) })),
      ),
    )
  }, [])

  const deleteCategory = useCallback<AppStoreValue["deleteCategory"]>((slug, trackId, categoryId) => {
    setRoles((prev) =>
      mapRole(prev, slug, (r) =>
        mapTrack(r, trackId, (t) => {
          const removed = t.categories.find((c) => c.id === categoryId)
          if (removed) {
            setProgress((p) => {
              const next = { ...p }
              for (const s of removed.skills) delete next[progressKey(trackId, s.id)]
              return next
            })
          }
          return { ...t, categories: t.categories.filter((c) => c.id !== categoryId) }
        }),
      ),
    )
  }, [])

  // ----- skills -----
  const addSkill = useCallback<AppStoreValue["addSkill"]>(
    (slug, trackId, categoryId, input) => {
      const skill: Skill = {
        id: genId("skill"),
        name: input.name.trim() || "New skill",
        description: input.description ?? "",
        whyItMatters: input.whyItMatters ?? "",
        importance: input.importance ?? "important",
        related: input.related,
      }
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => ({ ...c, skills: [...c.skills, skill] })),
          ),
        ),
      )
      return skill
    },
    [],
  )

  const updateSkill = useCallback<AppStoreValue["updateSkill"]>(
    (slug, trackId, categoryId, skillId, patch) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => mapSkill(c, skillId, (s) => ({ ...s, ...patch }))),
          ),
        ),
      )
    },
    [],
  )

  const moveSkill = useCallback<AppStoreValue["moveSkill"]>(
    (slug, trackId, categoryId, skillId, dir) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => ({ ...c, skills: moveItem(c.skills, skillId, dir) })),
          ),
        ),
      )
    },
    [],
  )

  const deleteSkill = useCallback<AppStoreValue["deleteSkill"]>(
    (slug, trackId, categoryId, skillId) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => ({ ...c, skills: c.skills.filter((s) => s.id !== skillId) })),
          ),
        ),
      )
      setProgress((p) => {
        const next = { ...p }
        delete next[progressKey(trackId, skillId)]
        return next
      })
    },
    [],
  )

  const value = useMemo<AppStoreValue>(
    () => ({
      roles,
      getStatus,
      setStatus,
      cycleStatus,
      createRole,
      updateRole,
      deleteRole,
      setActiveTrack,
      createTrack,
      duplicateTrack,
      updateTrack,
      deleteTrack,
      addCategory,
      updateCategory,
      moveCategory,
      deleteCategory,
      addSkill,
      updateSkill,
      moveSkill,
      deleteSkill,
    }),
    [
      roles,
      getStatus,
      setStatus,
      cycleStatus,
      createRole,
      updateRole,
      deleteRole,
      setActiveTrack,
      createTrack,
      duplicateTrack,
      updateTrack,
      deleteTrack,
      addCategory,
      updateCategory,
      moveCategory,
      deleteCategory,
      addSkill,
      updateSkill,
      moveSkill,
      deleteSkill,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error("useAppStore must be used within ProgressProvider")
  return ctx
}

// Backwards-compatible alias for components that only need progress helpers.
export function useProgress() {
  const { getStatus, setStatus, cycleStatus } = useAppStore()
  return { getStatus, setStatus, cycleStatus }
}

export function useRoleBySlug(slug: string): Role | undefined {
  const { roles } = useAppStore()
  return roles.find((r) => r.slug === slug)
}

export function useActiveTrack(role: Role | undefined): Track | undefined {
  if (!role) return undefined
  return getActiveTrack(role)
}
