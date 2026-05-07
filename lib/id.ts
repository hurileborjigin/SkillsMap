/**
 * Generates an RFC 4122 v4 UUID. We use UUIDs because all entity ids
 * (roles, tracks, categories, skills) are stored as UUIDs in Supabase.
 * The optional prefix argument is accepted for backwards compatibility
 * with older callers but is ignored.
 */
export function genId(_prefix = "id") {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }
  // Fallback (should rarely run in modern envs).
  const rand = Math.random().toString(16).slice(2)
  return `${rand}-${Date.now().toString(16)}`
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

export function uniqueSlug(base: string, existing: string[]) {
  const slug = slugify(base) || "role"
  if (!existing.includes(slug)) return slug
  let i = 2
  while (existing.includes(`${slug}-${i}`)) i++
  return `${slug}-${i}`
}
