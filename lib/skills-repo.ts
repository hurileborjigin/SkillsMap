/**
 * Supabase data layer for the SkillsMap app.
 *
 * Tables (see scripts/001-init-schema.sql):
 *   roles            (id, user_id, slug, name, short_description, long_description, difficulty, icon_key, is_default, active_track_id, position)
 *   tracks           (id, role_id, name, description, is_default, position)
 *   categories       (id, track_id, name, description, position)
 *   skills           (id, category_id, name, description, why_it_matters, importance, related, position)
 *   skill_progress   (user_id, track_id, skill_id, status)
 *
 * RLS scopes every row to the authenticated user, so we never need to filter
 * by user_id explicitly in SELECT queries.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { genId } from "./id"
import { seedRoles } from "./data"
import type {
  Category,
  Role,
  Skill,
  SkillImportance,
  SkillStatus,
  Track,
} from "./types"

type ProgressMap = Record<string, SkillStatus>

function progressKey(trackId: string, skillId: string) {
  return `${trackId}:${skillId}`
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

/** Load every role (with full track/category/skill graph) for the current user. */
export async function loadRoles(supabase: SupabaseClient): Promise<Role[]> {
  const { data: roleRows, error: rolesErr } = await supabase
    .from("roles")
    .select("*")
    .order("position", { ascending: true })
  if (rolesErr) throw rolesErr
  if (!roleRows || roleRows.length === 0) return []

  const roleIds = roleRows.map((r) => r.id)

  const { data: trackRows, error: tracksErr } = await supabase
    .from("tracks")
    .select("*")
    .in("role_id", roleIds)
    .order("position", { ascending: true })
  if (tracksErr) throw tracksErr

  const trackIds = (trackRows ?? []).map((t) => t.id)
  const { data: categoryRows, error: catsErr } =
    trackIds.length > 0
      ? await supabase
          .from("categories")
          .select("*")
          .in("track_id", trackIds)
          .order("position", { ascending: true })
      : { data: [], error: null }
  if (catsErr) throw catsErr

  const categoryIds = (categoryRows ?? []).map((c) => c.id)
  const { data: skillRows, error: skillsErr } =
    categoryIds.length > 0
      ? await supabase
          .from("skills")
          .select("*")
          .in("category_id", categoryIds)
          .order("position", { ascending: true })
      : { data: [], error: null }
  if (skillsErr) throw skillsErr

  // Group by parent
  const skillsByCategory = new Map<string, Skill[]>()
  for (const s of skillRows ?? []) {
    const list = skillsByCategory.get(s.category_id) ?? []
    list.push({
      id: s.id,
      name: s.name,
      description: s.description ?? "",
      whyItMatters: s.why_it_matters ?? "",
      importance: (s.importance as SkillImportance) ?? "important",
      related: s.related ?? undefined,
    })
    skillsByCategory.set(s.category_id, list)
  }

  const categoriesByTrack = new Map<string, Category[]>()
  for (const c of categoryRows ?? []) {
    const list = categoriesByTrack.get(c.track_id) ?? []
    list.push({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      skills: skillsByCategory.get(c.id) ?? [],
    })
    categoriesByTrack.set(c.track_id, list)
  }

  const tracksByRole = new Map<string, Track[]>()
  for (const t of trackRows ?? []) {
    const list = tracksByRole.get(t.role_id) ?? []
    list.push({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      isDefault: t.is_default ?? undefined,
      categories: categoriesByTrack.get(t.id) ?? [],
    })
    tracksByRole.set(t.role_id, list)
  }

  return roleRows.map<Role>((r) => {
    const tracks = tracksByRole.get(r.id) ?? []
    const activeTrackId =
      tracks.find((t) => t.id === r.active_track_id)?.id ?? tracks[0]?.id ?? ""
    return {
      slug: r.slug,
      name: r.name,
      shortDescription: r.short_description ?? "",
      longDescription: r.long_description ?? "",
      difficulty: r.difficulty ?? "Intermediate",
      iconKey: r.icon_key ?? "custom",
      tracks,
      activeTrackId,
      isDefault: r.is_default ?? undefined,
    }
  })
}

/** Load the user's progress map. */
export async function loadProgress(
  supabase: SupabaseClient,
): Promise<ProgressMap> {
  const { data, error } = await supabase
    .from("skill_progress")
    .select("track_id, skill_id, status")
  if (error) throw error
  const map: ProgressMap = {}
  for (const row of data ?? []) {
    map[progressKey(row.track_id, row.skill_id)] = row.status as SkillStatus
  }
  return map
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/**
 * Seed a brand-new user's account with the default role library.
 * Re-mints fresh UUIDs for every entity so they don't collide.
 */
export async function seedUser(supabase: SupabaseClient, userId: string) {
  const rolesPayload: any[] = []
  const tracksPayload: any[] = []
  const categoriesPayload: any[] = []
  const skillsPayload: any[] = []
  const progressPayload: any[] = []

  seedRoles.forEach((role, roleIdx) => {
    const roleId = genId()
    let activeTrackId = ""

    role.tracks.forEach((track, trackIdx) => {
      const newTrackId = genId()
      if (track.id === role.activeTrackId || trackIdx === 0) {
        activeTrackId = newTrackId
      }
      tracksPayload.push({
        id: newTrackId,
        role_id: roleId,
        name: track.name,
        description: track.description ?? "",
        is_default: !!track.isDefault,
        position: trackIdx,
      })

      track.categories.forEach((cat, catIdx) => {
        const newCatId = genId()
        categoriesPayload.push({
          id: newCatId,
          track_id: newTrackId,
          name: cat.name,
          description: cat.description ?? null,
          position: catIdx,
        })

        cat.skills.forEach((skill, skillIdx) => {
          const newSkillId = genId()
          skillsPayload.push({
            id: newSkillId,
            category_id: newCatId,
            name: skill.name,
            description: skill.description ?? "",
            why_it_matters: skill.whyItMatters ?? "",
            importance: skill.importance ?? "important",
            related: skill.related ?? null,
            position: skillIdx,
          })
          if (skill.status) {
            progressPayload.push({
              user_id: userId,
              track_id: newTrackId,
              skill_id: newSkillId,
              status: skill.status,
            })
          }
        })
      })
    })

    rolesPayload.push({
      id: roleId,
      user_id: userId,
      slug: role.slug,
      name: role.name,
      short_description: role.shortDescription ?? "",
      long_description: role.longDescription ?? "",
      difficulty: role.difficulty ?? "Intermediate",
      icon_key: role.iconKey ?? "custom",
      is_default: !!role.isDefault,
      active_track_id: activeTrackId,
      position: roleIdx,
    })
  })

  // Order matters: roles → tracks → categories → skills → progress.
  // Roles' active_track_id has a deferrable FK so we can insert tracks after.
  const steps: Array<[string, any[]]> = [
    ["roles", rolesPayload],
    ["tracks", tracksPayload],
    ["categories", categoriesPayload],
    ["skills", skillsPayload],
    ["skill_progress", progressPayload],
  ]
  for (const [table, rows] of steps) {
    if (rows.length === 0) continue
    const { error } = await supabase.from(table).insert(rows)
    if (error) throw error
  }
}

// ---------------------------------------------------------------------------
// Tiny helpers used by mutations
// ---------------------------------------------------------------------------

export async function getRoleIdBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}
