export type SkillStatus = "not-started" | "learning" | "completed"
export type SkillImportance = "required" | "important" | "optional"
export type Difficulty = "Beginner" | "Intermediate" | "Advanced"

export type IconKey =
  | "backend"
  | "frontend"
  | "llm"
  | "devops"
  | "cv"
  | "data"
  | "systems"
  | "analytics"
  | "mobile"
  | "security"
  | "product"
  | "design"
  | "code"
  | "custom"

export interface Skill {
  id: string
  name: string
  description: string
  whyItMatters: string
  importance: SkillImportance
  /** Optional seed status — used to populate the in-memory progress store on first load. */
  status?: SkillStatus
  related?: string[]
  resources?: { label: string; url: string }[]
}

export interface Category {
  id: string
  name: string
  description?: string
  skills: Skill[]
}

export interface Track {
  id: string
  name: string
  description: string
  /** Marks built-in (seed) tracks so the editor can offer "duplicate to customize" hints. */
  isDefault?: boolean
  categories: Category[]
}

export interface Role {
  slug: string
  name: string
  shortDescription: string
  longDescription: string
  difficulty: Difficulty
  iconKey: IconKey
  tracks: Track[]
  activeTrackId: string
  /** Marks built-in (seed) roles so the editor can show a "user-created" tag for new ones. */
  isDefault?: boolean
}
