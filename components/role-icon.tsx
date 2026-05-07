import { getIcon } from "@/lib/icon-options"
import type { IconKey } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  iconKey: IconKey | string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function RoleIcon({ iconKey, className, size = "md" }: Props) {
  const Icon = getIcon(iconKey)
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
