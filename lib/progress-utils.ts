import type { Category, Role, SkillStatus } from "./types"

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

function statusOf(skillId: string, fallback: SkillStatus, store?: Record<string, SkillStatus>) {
  if (!store) return fallback
  return store[skillId] ?? fallback
}

export function summarizeCategory(
  category: Category,
  store?: Record<string, SkillStatus>,
): ProgressBreakdown {
  let completed = 0
  let learning = 0
  let notStarted = 0
  let requiredTotal = 0
  let requiredCompleted = 0

  for (const skill of category.skills) {
    const s = statusOf(skill.id, skill.status, store)
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
    requiredPercent: requiredTotal === 0 ? 0 : Math.round((requiredCompleted / requiredTotal) * 100),
  }
}

export function summarizeRole(role: Role, store?: Record<string, SkillStatus>): ProgressBreakdown {
  const acc: ProgressBreakdown = {
    total: 0,
    completed: 0,
    learning: 0,
    notStarted: 0,
    percent: 0,
    requiredTotal: 0,
    requiredCompleted: 0,
    requiredPercent: 0,
  }
  for (const cat of role.categories) {
    const c = summarizeCategory(cat, store)
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
