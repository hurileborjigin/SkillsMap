import {
  Brain,
  Server,
  Layout,
  Cog,
  Eye,
  Sparkles,
  Code2,
  Database,
  Cpu,
  BarChart3,
  Smartphone,
  Shield,
  Compass,
  Palette,
  type LucideIcon,
} from "lucide-react"
import type { IconKey } from "./types"

export const ICON_OPTIONS: Record<IconKey, { label: string; Icon: LucideIcon }> = {
  llm: { label: "LLM / AI", Icon: Brain },
  backend: { label: "Backend", Icon: Server },
  frontend: { label: "Frontend", Icon: Layout },
  devops: { label: "DevOps", Icon: Cog },
  cv: { label: "Vision", Icon: Eye },
  data: { label: "Data", Icon: Database },
  systems: { label: "Systems", Icon: Cpu },
  analytics: { label: "Analytics", Icon: BarChart3 },
  mobile: { label: "Mobile", Icon: Smartphone },
  security: { label: "Security", Icon: Shield },
  product: { label: "Product", Icon: Compass },
  design: { label: "Design", Icon: Palette },
  code: { label: "Generic Code", Icon: Code2 },
  custom: { label: "Custom", Icon: Sparkles },
}

export const ICON_KEYS = Object.keys(ICON_OPTIONS) as IconKey[]

export function getIcon(key: IconKey | string): LucideIcon {
  return ICON_OPTIONS[(key as IconKey) ?? "custom"]?.Icon ?? Sparkles
}
