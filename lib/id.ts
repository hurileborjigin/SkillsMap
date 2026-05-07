export function genId(prefix = "id") {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36).slice(-4)
  return `${prefix}_${rand}${time}`
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
