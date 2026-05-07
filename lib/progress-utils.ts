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
 * Walk a skill tree and tally progress. Every node — parent skills and their
 * descendants — counts as one trackable item.
 */
function tallySkillTree(
  skills: Skill[],
  trackId: string,
  getStatus: GetStatusFn,
  acc: ProgressBreakdown,
) {
  for (const skill of skills) {
    const s = getStatus(trackId, skill.id)
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
    if (getStatus(trackId, c.id) === "completed") completed++
  }
  return { completed, total: children.length }
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
