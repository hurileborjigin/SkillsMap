"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createClient } from "./supabase/client"
import { seedRoles, getActiveTrack } from "./data"
import { genId, uniqueSlug } from "./id"
import { loadProgress, loadRoles, seedUser } from "./skills-repo"
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
  user: User | null
  loading: boolean

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
  // Memoize the Supabase browser client — it is a singleton internally.
  const supabase = useMemo<SupabaseClient>(() => createClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>(() => seedRoles)
  const [progress, setProgress] = useState<ProgressMap>(() =>
    buildInitialProgress(seedRoles),
  )
  const [loading, setLoading] = useState(true)

  /** Maps role slug → DB UUID for the current user's roles. Empty when signed-out. */
  const roleIdBySlug = useRef<Map<string, string>>(new Map())

  /** Tiny logger for fire-and-forget DB writes. */
  const safeWrite = useCallback(async (fn: () => Promise<unknown>) => {
    try {
      await fn()
    } catch (err) {
      console.log("[v0] DB write failed:", err)
    }
  }, [])

  const refresh = useCallback(
    async (currentUser: User | null) => {
      setLoading(true)
      try {
        if (!currentUser) {
          roleIdBySlug.current = new Map()
          setRoles(seedRoles)
          setProgress(buildInitialProgress(seedRoles))
          return
        }
        let dbRoles = await loadRoles(supabase)
        if (dbRoles.length === 0) {
          await seedUser(supabase, currentUser.id)
          dbRoles = await loadRoles(supabase)
        }
        const dbProgress = await loadProgress(supabase)
        const ids = new Map<string, string>()
        // We need the DB id (uuid) for every role even though the public key is slug.
        const { data: idRows, error: idErr } = await supabase
          .from("roles")
          .select("id, slug")
        if (idErr) throw idErr
        for (const row of idRows ?? []) ids.set(row.slug, row.id)
        roleIdBySlug.current = ids
        setRoles(dbRoles)
        setProgress(dbProgress)
      } catch (err) {
        console.log("[v0] Failed to load app data:", err)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  // Watch auth state.
  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(data.user ?? null)
      void refresh(data.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      void refresh(nextUser)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, refresh])

  // ----- progress -----
  const getStatus = useCallback(
    (trackId: string, skillId: string, fallback: SkillStatus = "not-started") =>
      progress[progressKey(trackId, skillId)] ?? fallback,
    [progress],
  )

  const persistStatus = useCallback(
    (trackId: string, skillId: string, status: SkillStatus) => {
      if (!user) return
      void safeWrite(() =>
        supabase.from("skill_progress").upsert(
          {
            user_id: user.id,
            track_id: trackId,
            skill_id: skillId,
            status,
          },
          { onConflict: "user_id,track_id,skill_id" },
        ),
      )
    },
    [supabase, user, safeWrite],
  )

  const setStatus = useCallback(
    (trackId: string, skillId: string, status: SkillStatus) => {
      setProgress((prev) => ({ ...prev, [progressKey(trackId, skillId)]: status }))
      persistStatus(trackId, skillId, status)
    },
    [persistStatus],
  )

  const cycleStatus = useCallback(
    (trackId: string, skillId: string) => {
      let nextStatus: SkillStatus = "not-started"
      setProgress((prev) => {
        const k = progressKey(trackId, skillId)
        const current = prev[k] ?? "not-started"
        nextStatus =
          STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
        return { ...prev, [k]: nextStatus }
      })
      persistStatus(trackId, skillId, nextStatus)
    },
    [persistStatus],
  )

  // ----- roles -----
  const createRole = useCallback<AppStoreValue["createRole"]>(
    (input) => {
      const existing = roles.map((r) => r.slug)
      const slug = uniqueSlug(input.name, existing)
      const trackId = genId()
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

      if (user) {
        const roleId = genId()
        roleIdBySlug.current.set(slug, roleId)
        void safeWrite(async () => {
          const { error: rErr } = await supabase.from("roles").insert({
            id: roleId,
            user_id: user.id,
            slug,
            name: role.name,
            short_description: role.shortDescription,
            long_description: role.longDescription,
            difficulty: role.difficulty,
            icon_key: role.iconKey,
            is_default: false,
            active_track_id: trackId,
            position: roles.length,
          })
          if (rErr) throw rErr
          const { error: tErr } = await supabase.from("tracks").insert({
            id: trackId,
            role_id: roleId,
            name: role.tracks[0].name,
            description: role.tracks[0].description,
            is_default: false,
            position: 0,
          })
          if (tErr) throw tErr
        })
      }
      return role
    },
    [roles, supabase, user, safeWrite],
  )

  const updateRole = useCallback<AppStoreValue["updateRole"]>(
    (slug, patch) => {
      setRoles((prev) => mapRole(prev, slug, (r) => ({ ...r, ...patch })))
      if (!user) return
      const roleId = roleIdBySlug.current.get(slug)
      if (!roleId) return
      const dbPatch: Record<string, unknown> = {}
      if (patch.name !== undefined) dbPatch.name = patch.name
      if (patch.shortDescription !== undefined)
        dbPatch.short_description = patch.shortDescription
      if (patch.longDescription !== undefined)
        dbPatch.long_description = patch.longDescription
      if (patch.difficulty !== undefined) dbPatch.difficulty = patch.difficulty
      if (patch.iconKey !== undefined) dbPatch.icon_key = patch.iconKey
      if (Object.keys(dbPatch).length === 0) return
      void safeWrite(() => supabase.from("roles").update(dbPatch).eq("id", roleId))
    },
    [supabase, user, safeWrite],
  )

  const deleteRole = useCallback<AppStoreValue["deleteRole"]>(
    (slug) => {
      let target: Role | undefined
      setRoles((prev) => {
        target = prev.find((r) => r.slug === slug)
        if (!target) return prev
        return prev.filter((r) => r.slug !== slug)
      })
      // also clean up progress for any skill in any of the role's tracks
      if (target) {
        setProgress((p) => {
          const next = { ...p }
          for (const t of target!.tracks) {
            for (const c of t.categories) {
              for (const s of c.skills) delete next[progressKey(t.id, s.id)]
            }
          }
          return next
        })
      }
      if (!user) return
      const roleId = roleIdBySlug.current.get(slug)
      if (!roleId) return
      roleIdBySlug.current.delete(slug)
      void safeWrite(() => supabase.from("roles").delete().eq("id", roleId))
    },
    [supabase, user, safeWrite],
  )

  // ----- tracks -----
  const setActiveTrack = useCallback<AppStoreValue["setActiveTrack"]>(
    (slug, trackId) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          r.tracks.some((t) => t.id === trackId) ? { ...r, activeTrackId: trackId } : r,
        ),
      )
      if (!user) return
      const roleId = roleIdBySlug.current.get(slug)
      if (!roleId) return
      void safeWrite(() =>
        supabase.from("roles").update({ active_track_id: trackId }).eq("id", roleId),
      )
    },
    [supabase, user, safeWrite],
  )

  const createTrack = useCallback<AppStoreValue["createTrack"]>(
    (slug, input) => {
      const trackId = genId()
      const newTrack: Track = {
        id: trackId,
        name: input?.name?.trim() || "New Track",
        description: input?.description?.trim() || "An alternative path through this role.",
        categories: [],
      }
      let position = 0
      setRoles((prev) =>
        mapRole(prev, slug, (r) => {
          position = r.tracks.length
          return {
            ...r,
            tracks: [...r.tracks, newTrack],
            activeTrackId: trackId,
          }
        }),
      )
      if (user) {
        const roleId = roleIdBySlug.current.get(slug)
        if (roleId) {
          void safeWrite(async () => {
            const { error: tErr } = await supabase.from("tracks").insert({
              id: trackId,
              role_id: roleId,
              name: newTrack.name,
              description: newTrack.description,
              is_default: false,
              position,
            })
            if (tErr) throw tErr
            await supabase
              .from("roles")
              .update({ active_track_id: trackId })
              .eq("id", roleId)
          })
        }
      }
      return newTrack
    },
    [supabase, user, safeWrite],
  )

  const duplicateTrack = useCallback<AppStoreValue["duplicateTrack"]>(
    (slug, trackId) => {
      let created: Track | undefined
      let dbInserts: {
        roleId: string
        track: any
        cats: any[]
        skills: any[]
      } | null = null

      setRoles((prev) =>
        mapRole(prev, slug, (r) => {
          const source = r.tracks.find((t) => t.id === trackId)
          if (!source) return r
          const newTrackId = genId()
          const cats: Category[] = []
          const dbCats: any[] = []
          const dbSkills: any[] = []
          source.categories.forEach((c, ci) => {
            const newCatId = genId()
            const skills = c.skills.map<Skill>((s, si) => {
              const newSkillId = genId()
              dbSkills.push({
                id: newSkillId,
                category_id: newCatId,
                name: s.name,
                description: s.description ?? "",
                why_it_matters: s.whyItMatters ?? "",
                importance: s.importance ?? "important",
                related: s.related ?? null,
                position: si,
              })
              return { ...s, id: newSkillId }
            })
            cats.push({ ...c, id: newCatId, skills })
            dbCats.push({
              id: newCatId,
              track_id: newTrackId,
              name: c.name,
              description: c.description ?? null,
              position: ci,
            })
          })
          const dup: Track = {
            id: newTrackId,
            name: `${source.name} (copy)`,
            description: source.description,
            categories: cats,
          }
          created = dup
          const roleDbId = roleIdBySlug.current.get(slug)
          if (user && roleDbId) {
            dbInserts = {
              roleId: roleDbId,
              track: {
                id: newTrackId,
                role_id: roleDbId,
                name: dup.name,
                description: dup.description,
                is_default: false,
                position: r.tracks.length,
              },
              cats: dbCats,
              skills: dbSkills,
            }
          }
          return { ...r, tracks: [...r.tracks, dup], activeTrackId: newTrackId }
        }),
      )

      if (dbInserts) {
        void safeWrite(async () => {
          const { error: tErr } = await supabase
            .from("tracks")
            .insert(dbInserts!.track)
          if (tErr) throw tErr
          if (dbInserts!.cats.length > 0) {
            const { error: cErr } = await supabase
              .from("categories")
              .insert(dbInserts!.cats)
            if (cErr) throw cErr
          }
          if (dbInserts!.skills.length > 0) {
            const { error: sErr } = await supabase
              .from("skills")
              .insert(dbInserts!.skills)
            if (sErr) throw sErr
          }
          await supabase
            .from("roles")
            .update({ active_track_id: dbInserts!.track.id })
            .eq("id", dbInserts!.roleId)
        })
      }
      return created
    },
    [supabase, user, safeWrite],
  )

  const updateTrack = useCallback<AppStoreValue["updateTrack"]>(
    (slug, trackId, patch) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) => mapTrack(r, trackId, (t) => ({ ...t, ...patch }))),
      )
      if (!user) return
      const dbPatch: Record<string, unknown> = {}
      if (patch.name !== undefined) dbPatch.name = patch.name
      if (patch.description !== undefined) dbPatch.description = patch.description
      if (Object.keys(dbPatch).length === 0) return
      void safeWrite(() =>
        supabase.from("tracks").update(dbPatch).eq("id", trackId),
      )
    },
    [supabase, user, safeWrite],
  )

  const deleteTrack = useCallback<AppStoreValue["deleteTrack"]>(
    (slug, trackId) => {
      let didRemove = false
      let newActive: string | null = null
      setRoles((prev) =>
        mapRole(prev, slug, (r) => {
          if (r.tracks.length <= 1) return r
          const remaining = r.tracks.filter((t) => t.id !== trackId)
          const removed = r.tracks.find((t) => t.id === trackId)
          if (removed) {
            didRemove = true
            setProgress((p) => {
              const next = { ...p }
              for (const c of removed.categories) {
                for (const s of c.skills) delete next[progressKey(removed.id, s.id)]
              }
              return next
            })
          }
          const activeTrackId =
            r.activeTrackId === trackId ? remaining[0].id : r.activeTrackId
          newActive = activeTrackId
          return { ...r, tracks: remaining, activeTrackId }
        }),
      )
      if (!user || !didRemove) return
      const roleId = roleIdBySlug.current.get(slug)
      void safeWrite(async () => {
        if (roleId && newActive) {
          await supabase
            .from("roles")
            .update({ active_track_id: newActive })
            .eq("id", roleId)
        }
        await supabase.from("tracks").delete().eq("id", trackId)
      })
    },
    [supabase, user, safeWrite],
  )

  // ----- categories -----
  const addCategory = useCallback<AppStoreValue["addCategory"]>(
    (slug, trackId, input) => {
      const cat: Category = {
        id: genId(),
        name: input?.name?.trim() || "New category",
        description: input?.description,
        skills: [],
      }
      let position = 0
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) => {
            position = t.categories.length
            return { ...t, categories: [...t.categories, cat] }
          }),
        ),
      )
      if (user) {
        void safeWrite(() =>
          supabase.from("categories").insert({
            id: cat.id,
            track_id: trackId,
            name: cat.name,
            description: cat.description ?? null,
            position,
          }),
        )
      }
      return cat
    },
    [supabase, user, safeWrite],
  )

  const updateCategory = useCallback<AppStoreValue["updateCategory"]>(
    (slug, trackId, categoryId, patch) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) => mapCategory(t, categoryId, (c) => ({ ...c, ...patch }))),
        ),
      )
      if (!user) return
      const dbPatch: Record<string, unknown> = {}
      if (patch.name !== undefined) dbPatch.name = patch.name
      if (patch.description !== undefined) dbPatch.description = patch.description ?? null
      if (Object.keys(dbPatch).length === 0) return
      void safeWrite(() =>
        supabase.from("categories").update(dbPatch).eq("id", categoryId),
      )
    },
    [supabase, user, safeWrite],
  )

  const moveCategory = useCallback<AppStoreValue["moveCategory"]>(
    (slug, trackId, categoryId, dir) => {
      let positions: Array<{ id: string; position: number }> = []
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) => {
            const next = moveItem(t.categories, categoryId, dir)
            positions = next.map((c, i) => ({ id: c.id, position: i }))
            return { ...t, categories: next }
          }),
        ),
      )
      if (!user || positions.length === 0) return
      // Persist position swap (only the two affected rows changed).
      void safeWrite(async () => {
        for (const p of positions) {
          const { error } = await supabase
            .from("categories")
            .update({ position: p.position })
            .eq("id", p.id)
          if (error) throw error
        }
      })
    },
    [supabase, user, safeWrite],
  )

  const deleteCategory = useCallback<AppStoreValue["deleteCategory"]>(
    (slug, trackId, categoryId) => {
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
      if (!user) return
      void safeWrite(() =>
        supabase.from("categories").delete().eq("id", categoryId),
      )
    },
    [supabase, user, safeWrite],
  )

  // ----- skills -----
  const addSkill = useCallback<AppStoreValue["addSkill"]>(
    (slug, trackId, categoryId, input) => {
      const skill: Skill = {
        id: genId(),
        name: input.name.trim() || "New skill",
        description: input.description ?? "",
        whyItMatters: input.whyItMatters ?? "",
        importance: input.importance ?? "important",
        related: input.related,
      }
      let position = 0
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => {
              position = c.skills.length
              return { ...c, skills: [...c.skills, skill] }
            }),
          ),
        ),
      )
      if (user) {
        void safeWrite(() =>
          supabase.from("skills").insert({
            id: skill.id,
            category_id: categoryId,
            name: skill.name,
            description: skill.description ?? "",
            why_it_matters: skill.whyItMatters ?? "",
            importance: skill.importance ?? "important",
            related: skill.related ?? null,
            position,
          }),
        )
      }
      return skill
    },
    [supabase, user, safeWrite],
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
      if (!user) return
      const dbPatch: Record<string, unknown> = {}
      if (patch.name !== undefined) dbPatch.name = patch.name
      if (patch.description !== undefined) dbPatch.description = patch.description ?? ""
      if (patch.whyItMatters !== undefined) dbPatch.why_it_matters = patch.whyItMatters ?? ""
      if (patch.importance !== undefined) dbPatch.importance = patch.importance
      if (patch.related !== undefined) dbPatch.related = patch.related ?? null
      if (Object.keys(dbPatch).length === 0) return
      void safeWrite(() => supabase.from("skills").update(dbPatch).eq("id", skillId))
    },
    [supabase, user, safeWrite],
  )

  const moveSkill = useCallback<AppStoreValue["moveSkill"]>(
    (slug, trackId, categoryId, skillId, dir) => {
      let positions: Array<{ id: string; position: number }> = []
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => {
              const next = moveItem(c.skills, skillId, dir)
              positions = next.map((s, i) => ({ id: s.id, position: i }))
              return { ...c, skills: next }
            }),
          ),
        ),
      )
      if (!user || positions.length === 0) return
      void safeWrite(async () => {
        for (const p of positions) {
          const { error } = await supabase
            .from("skills")
            .update({ position: p.position })
            .eq("id", p.id)
          if (error) throw error
        }
      })
    },
    [supabase, user, safeWrite],
  )

  const deleteSkill = useCallback<AppStoreValue["deleteSkill"]>(
    (slug, trackId, categoryId, skillId) => {
      setRoles((prev) =>
        mapRole(prev, slug, (r) =>
          mapTrack(r, trackId, (t) =>
            mapCategory(t, categoryId, (c) => ({
              ...c,
              skills: c.skills.filter((s) => s.id !== skillId),
            })),
          ),
        ),
      )
      setProgress((p) => {
        const next = { ...p }
        delete next[progressKey(trackId, skillId)]
        return next
      })
      if (!user) return
      void safeWrite(() => supabase.from("skills").delete().eq("id", skillId))
    },
    [supabase, user, safeWrite],
  )

  const value = useMemo<AppStoreValue>(
    () => ({
      roles,
      user,
      loading,
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
      user,
      loading,
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
