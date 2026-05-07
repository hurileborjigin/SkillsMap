import { getActiveTrack } from "./data"
import type { Category, Role, SkillStatus, Track } from "./types"

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

export function summarizeCategory(
  category: Category,
  trackId: string,
  getStatus: GetStatusFn,
): ProgressBreakdown {
  let completed = 0
  let learning = 0
  let notStarted = 0
  let requiredTotal = 0
  let requiredCompleted = 0

  for (const skill of category.skills) {
    const s = getStatus(trackId, skill.id)
    if (s === "completed") completed++
    else if (s === "learning") learning++
    else notStarted++
    if (skill.importance === "required") {
      requiredTotal++
      if (s === "completed") requiredCompleted++
    }
  }

  const total = category.skills.length
  return {
    total,
    completed,
    learning,
    notStarted,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    requiredTotal,
    requiredCompleted,
    requiredPercent:
      requiredTotal === 0 ? 0 : Math.round((requiredCompleted / requiredTotal) * 100),
  }
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
