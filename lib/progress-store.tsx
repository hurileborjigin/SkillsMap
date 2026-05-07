"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { roles } from "./data"
import type { SkillStatus } from "./types"

type ProgressMap = Record<string, SkillStatus>

interface ProgressContextValue {
  progress: ProgressMap
  setStatus: (skillId: string, status: SkillStatus) => void
  cycleStatus: (skillId: string) => void
  getStatus: (skillId: string, fallback: SkillStatus) => SkillStatus
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

const order: SkillStatus[] = ["not-started", "learning", "completed"]

// Seed the in-memory store from the static data so the UI feels alive on first load.
function buildInitialProgress(): ProgressMap {
  const map: ProgressMap = {}
  for (const role of roles) {
    for (const cat of role.categories) {
      for (const skill of cat.skills) {
        map[skill.id] = skill.status
      }
    }
  }
  return map
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(() => buildInitialProgress())

  const setStatus = useCallback((skillId: string, status: SkillStatus) => {
    setProgress((prev) => ({ ...prev, [skillId]: status }))
  }, [])

  const cycleStatus = useCallback((skillId: string) => {
    setProgress((prev) => {
      const current = prev[skillId] ?? "not-started"
      const next = order[(order.indexOf(current) + 1) % order.length]
      return { ...prev, [skillId]: next }
    })
  }, [])

  const getStatus = useCallback(
    (skillId: string, fallback: SkillStatus) => progress[skillId] ?? fallback,
    [progress],
  )

  const value = useMemo(
    () => ({ progress, setStatus, cycleStatus, getStatus }),
    [progress, setStatus, cycleStatus, getStatus],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider")
  return ctx
}
