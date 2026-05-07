import { Brain, Server, Layout, Cog, Eye } from "lucide-react"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

const map: Record<Role["iconKey"], typeof Brain> = {
  llm: Brain,
  backend: Server,
  frontend: Layout,
  devops: Cog,
  cv: Eye,
}

interface Props {
  iconKey: Role["iconKey"]
  className?: string
  size?: "sm" | "md" | "lg"
}

export function RoleIcon({ iconKey, className, size = "md" }: Props) {
  const Icon = map[iconKey]
  const sizeClasses = {
    sm: "size-7",
    md: "size-9",
    lg: "size-12",
  }
  const innerSize = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-lg border border-border bg-muted text-primary",
        sizeClasses[size],
        className,
      )}
    >
      <Icon className={innerSize[size]} aria-hidden="true" />
    </span>
  )
}
