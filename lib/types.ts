export type SkillStatus = "not-started" | "learning" | "completed"
export type SkillImportance = "required" | "important" | "optional"
export type Difficulty = "Beginner" | "Intermediate" | "Advanced"

export interface Skill {
  id: string
  name: string
  description: string
  whyItMatters: string
  importance: SkillImportance
  status: SkillStatus
  related?: string[]
  resources?: { label: string; url: string }[]
}

export interface Category {
  id: string
  name: string
  description?: string
  skills: Skill[]
}

export interface Role {
  slug: string
  name: string
  shortDescription: string
  longDescription: string
  difficulty: Difficulty
  iconKey: "backend" | "frontend" | "llm" | "devops" | "cv"
  categories: Category[]
}
