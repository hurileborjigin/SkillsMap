import { getActiveTrack } from "./data"
import type { Category, Role, Skill, SkillStatus, Track } from "./types"

export interface ProgressBreakdown {
  total: number
  completed: number
  learning: number
  notStarted: number
  percent: number
  requiredTotal: number
  requiredCompleted: number
  requiredPercent: number
}

export type GetStatusFn = (trackId: string, skillId: string) => SkillStatus

const EMPTY: ProgressBreakdown = {
  total: 0,
  completed: 0,
  learning: 0,
  notStarted: 0,
  percent: 0,
  requiredTotal: 0,
  requiredCompleted: 0,
  requiredPercent: 0,
}

/**
 * Compute the effective status of a skill, taking its sub-skills into account:
 *
 *   - leaf skill          → its raw stored status
 *   - all descendants done → "completed" (auto-checked, even if raw is something else)
 *   - any descendant has progress → at least "learning"
 *   - parent raw is "completed" but children aren't all done → demote to "learning"
 *
 * Used everywhere we display or count a skill so the parent "checkbox" always
 * stays in sync with its children.
 */
export function getEffectiveStatus(
  skill: Skill,
  trackId: string,
  getStatus: GetStatusFn,
): SkillStatus {
  const raw = getStatus(trackId, skill.id)
  const children = skill.children ?? []
  if (children.length === 0) return raw

  let allCompleted = true
  let anyProgress = false
  for (const child of children) {
    const childEff = getEffectiveStatus(child, trackId, getStatus)
    if (childEff !== "completed") allCompleted = false
    if (childEff !== "not-started") anyProgress = true
  }

  if (allCompleted) return "completed"
  if (raw === "completed") return "learning"
  if (raw === "not-started" && anyProgress) return "learning"
  return raw
}

/**
 * Walk a skill tree and tally progress. Every node — parent skills and their
 * descendants — counts as one trackable item. Uses the *effective* status so a
 * parent that is auto-completed via its children counts as completed.
 */
function tallySkillTree(
  skills: Skill[],
  trackId: string,
  getStatus: GetStatusFn,
  acc: ProgressBreakdown,
) {
  for (const skill of skills) {
    const s = getEffectiveStatus(skill, trackId, getStatus)
    if (s === "completed") acc.completed++
    else if (s === "learning") acc.learning++
    else acc.notStarted++
    acc.total++
    if (skill.importance === "required") {
      acc.requiredTotal++
      if (s === "completed") acc.requiredCompleted++
    }
    if (skill.children?.length) {
      tallySkillTree(skill.children, trackId, getStatus, acc)
    }
  }
}

export function summarizeCategory(
  category: Category,
  trackId: string,
  getStatus: GetStatusFn,
): ProgressBreakdown {
  const acc = { ...EMPTY }
  tallySkillTree(category.skills, trackId, getStatus, acc)
  acc.percent = acc.total === 0 ? 0 : Math.round((acc.completed / acc.total) * 100)
  acc.requiredPercent =
    acc.requiredTotal === 0 ? 0 : Math.round((acc.requiredCompleted / acc.requiredTotal) * 100)
  return acc
}

export function summarizeTrack(track: Track, getStatus: GetStatusFn): ProgressBreakdown {
  const acc = { ...EMPTY }
  for (const cat of track.categories) {
    const c = summarizeCategory(cat, track.id, getStatus)
    acc.total += c.total
    acc.completed += c.completed
    acc.learning += c.learning
    acc.notStarted += c.notStarted
    acc.requiredTotal += c.requiredTotal
    acc.requiredCompleted += c.requiredCompleted
  }
  acc.percent = acc.total === 0 ? 0 : Math.round((acc.completed / acc.total) * 100)
  acc.requiredPercent =
    acc.requiredTotal === 0 ? 0 : Math.round((acc.requiredCompleted / acc.requiredTotal) * 100)
  return acc
}

/** Summarizes a role by its currently active track. */
export function summarizeRole(role: Role, getStatus: GetStatusFn): ProgressBreakdown {
  const track = getActiveTrack(role)
  return summarizeTrack(track, getStatus)
}

/**
 * Summarize only the immediate children of a parent skill — used by the UI to
 * show "X / N done" badges next to a parent without recursing further.
 */
export function summarizeChildren(
  parent: Skill,
  trackId: string,
  getStatus: GetStatusFn,
): { completed: number; total: number } {
  const children = parent.children ?? []
  let completed = 0
  for (const c of children) {
    if (getEffectiveStatus(c, trackId, getStatus) === "completed") completed++
  }
  return { completed, total: children.length }
}

/**
 * Count every descendant (any depth) whose effective status is NOT completed.
 * Used by the confirm dialog when the user marks a parent as completed without
 * having ticked off all sub-skills first.
 */
export function countIncompleteDescendants(
  skill: Skill,
  trackId: string,
  getStatus: GetStatusFn,
): number {
  let n = 0
  const walk = (list: Skill[]) => {
    for (const s of list) {
      if (getEffectiveStatus(s, trackId, getStatus) !== "completed") n++
      if (s.children?.length) walk(s.children)
    }
  }
  walk(skill.children ?? [])
  return n
}

/** Flatten a skill tree into a list — used by the "related skills" picker. */
export function flattenSkills(skills: Skill[]): Skill[] {
  const out: Skill[] = []
  const walk = (list: Skill[]) => {
    for (const s of list) {
      out.push(s)
      if (s.children?.length) walk(s.children)
    }
  }
  walk(skills)
  return out
}
