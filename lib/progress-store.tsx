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

// ---------- recursive skill helpers ----------

/** Walk a skill tree, applying `fn` to every node (parents and descendants). */
function forEachSkill(skills: Skill[], fn: (s: Skill) => void) {
  for (const s of skills) {
    fn(s)
    if (s.children?.length) forEachSkill(s.children, fn)
  }
}

/** Collect every skill id in the subtree rooted at any of the given skills. */
function collectSkillIds(skills: Skill[]): string[] {
  const ids: string[] = []
  forEachSkill(skills, (s) => ids.push(s.id))
  return ids
}

/** Apply `fn` to the matching skill anywhere in the tree, returning a new array. */
function mapSkillInTree(
  skills: Skill[],
  skillId: string,
  fn: (s: Skill) => Skill,
): Skill[] {
  return skills.map((s) => {
    if (s.id === skillId) return fn(s)
    if (s.children?.length) {
      const nextChildren = mapSkillInTree(s.children, skillId, fn)
      if (nextChildren !== s.children) return { ...s, children: nextChildren }
    }
    return s
  })
}

/** Insert `child` under the parent matching `parentSkillId`, anywhere in the tree. */
function appendChildInTree(skills: Skill[], parentSkillId: string, child: Skill): Skill[] {
  return skills.map((s) => {
    if (s.id === parentSkillId) {
      return { ...s, children: [...(s.children ?? []), child] }
    }
    if (s.children?.length) {
      const next = appendChildInTree(s.children, parentSkillId, child)
      if (next !== s.children) return { ...s, children: next }
    }
    return s
  })
}

/** Remove the skill matching `skillId` from anywhere in the tree. */
function removeSkillInTree(skills: Skill[], skillId: string): Skill[] {
  const filtered = skills.filter((s) => s.id !== skillId)
  return filtered.map((s) => {
    if (!s.children?.length) return s
    const nextChildren = removeSkillInTree(s.children, skillId)
    if (nextChildren === s.children) return s
    return { ...s, children: nextChildren }
  })
}

/** Move the skill among its siblings (works at any depth in the tree). */
function moveSkillInTree(skills: Skill[], skillId: string, dir: -1 | 1): Skill[] {
  const idx = skills.findIndex((s) => s.id === skillId)
  if (idx >= 0) {
    return moveItem(skills, skillId, dir)
  }
  return skills.map((s) => {
    if (!s.children?.length) return s
    const nextChildren = moveSkillInTree(s.children, skillId, dir)
    if (nextChildren === s.children) return s
    return { ...s, children: nextChildren }
  })
}

/** True iff the skill at `skillId` is the first/last among its siblings. */
function getSkillSiblingPosition(
  skills: Skill[],
  skillId: string,
): { isFirst: boolean; isLast: boolean } | null {
  const idx = skills.findIndex((s) => s.id === skillId)
  if (idx >= 0) {
    return { isFirst: idx === 0, isLast: idx === skills.length - 1 }
  }
  for (const s of skills) {
    if (!s.children?.length) continue
    const r = getSkillSiblingPosition(s.children, skillId)
    if (r) return r
  }
  return null
}

/** Deep clone a skill subtree, re-minting every id. Used by `duplicateTrack`. */
function cloneSkillTree(skills: Skill[]): Skill[] {
  return skills.map((s) => ({
    ...s,
    id: genId("skill"),
    children: s.children?.length ? cloneSkillTree(s.children) : undefined,
  }))
}

/** Seed the progress map from any seed `status` fields anywhere in the tree. */
function buildInitialProgress(roles: Role[]): ProgressMap {
  const map: ProgressMap = {}
  for (const role of roles) {
    for (const track of role.tracks) {
      for (const cat of track.categories) {
        forEachSkill(cat.skills, (s) => {
          if (s.status) map[progressKey(track.id, s.id)] = s.status
        })
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
  /**
   * Set the status of a skill AND every one of its descendants in one shot.
   * Used when the user explicitly marks a parent skill as completed (cascade
   * down to all sub-skills) or resets a parent that was auto-completed.
   */
  setSkillTreeStatus: (trackId: string, skill: Skill, status: SkillStatus) => void

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

  // skill mutations — every method works at any depth in the tree.
  // Pass `parentSkillId` to add/insert a sub-skill under an existing skill;
  // omit it (or pass null) to add at the top level of the category.
  addSkill: (
    slug: string,
    trackId: string,
    categoryId: string,
    input: SkillInput,
    parentSkillId?: string | null,
  ) => Skill | undefined
  updateSkill: (
    slug: string,
    trackId: string,
    categoryId: string,
    skillId: string,
    patch: Partial<Omit<Skill, "id" | "children">>,
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

  const setSkillTreeStatus = useCallback<AppStoreValue["setSkillTreeStatus"]>(
    (trackId, skill, status) => {
      setProgress((prev) => {
        const next = { ...prev }
        forEachSkill([skill], (s) => {
          next[progressKey(trackId, s.id)] = status
        })
        return next
      })
    },
    [],
  )

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
      // also clean up progress for any skill (at any depth) in any of the role's tracks
      setProgress((p) => {
        const next = { ...p }
        for (const t of target.tracks) {
          for (const c of t.categories) {
            for (const id of collectSkillIds(c.skills)) delete next[progressKey(t.id, id)]
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
        // give every nested category & skill (and sub-skill) a fresh id so
        // progress can diverge per track.
        const categories = source.categories.map<Category>((c) => ({
          ...c,
          id: genId("cat"),
          skills: cloneSkillTree(c.skills),
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
              for (const id of collectSkillIds(c.skills)) delete next[progressKey(removed.id, id)]
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
              for (const id of collectSkillIds(removed.skills)) delete next[progressKey(trackId, id)]
              return next
            })
          }
          return { ...t, categories: t.categories.filter((c) => c.id !== categoryId) }
        }),
      ),
    )
  }, [])

  // ----- skills (work at any depth) -----
  const addSkill = useCallback<AppStoreValue["addSkill"]>(
    (slug, trackId, categoryId, input, parentSkillId) => {
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
            mapCategory(t, categoryId, (c) => {
              if (parentSkillId) {
                return { ...c, skills: appendChildInTree(c.skills, parentSkillId, skill) }
              }
              return { ...c, skills: [...c.skills, skill] }
            }),
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
            mapCategory(t, categoryId, (c) => ({
              ...c,
              skills: mapSkillInTree(c.skills, skillId, (s) => ({ ...s, ...patch })),
            })),
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
            mapCategory(t, categoryId, (c) => ({
              ...c,
              skills: moveSkillInTree(c.skills, skillId, dir),
            })),
          ),
        ),
      )
    },
    [],
  )

  const deleteSkill = useCallback<AppStoreValue["deleteSkill"]>(
    (slug, trackId, categoryId, skillId) => {
      // Capture the subtree so we can purge progress for the deleted node + its descendants.
      let removedIds: string[] = []
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => {
              const findSkill = (skills: Skill[]): Skill | null => {
                for (const s of skills) {
                  if (s.id === skillId) return s
                  if (s.children?.length) {
                    const found = findSkill(s.children)
                    if (found) return found
                  }
                }
                return null
              }
              const target = findSkill(c.skills)
              if (target) removedIds = collectSkillIds([target])
              return { ...c, skills: removeSkillInTree(c.skills, skillId) }
            }),
          ),
        ),
      )
      if (removedIds.length > 0) {
        setProgress((p) => {
          const next = { ...p }
          for (const id of removedIds) delete next[progressKey(trackId, id)]
          return next
        })
      }
    },
    [],
  )

  const value = useMemo<AppStoreValue>(
    () => ({
      roles,
      getStatus,
      setStatus,
      cycleStatus,
      setSkillTreeStatus,
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
      setSkillTreeStatus,
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
  const { getStatus, setStatus, cycleStatus, setSkillTreeStatus } = useAppStore()
  return { getStatus, setStatus, cycleStatus, setSkillTreeStatus }
}

export function useRoleBySlug(slug: string): Role | undefined {
  const { roles } = useAppStore()
  return roles.find((r) => r.slug === slug)
}

export function useActiveTrack(role: Role | undefined): Track | undefined {
  if (!role) return undefined
  return getActiveTrack(role)
}

// Exported so components (e.g. CategoryEditor) can compute disabled states for
// the up/down buttons without re-implementing the recursion.
export { getSkillSiblingPosition }
