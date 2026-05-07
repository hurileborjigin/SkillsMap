"use client"

import { Check } from "lucide-react"
import { ICON_KEYS, ICON_OPTIONS } from "@/lib/icon-options"
import type { IconKey } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  value: IconKey
  onChange: (value: IconKey) => void
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {ICON_KEYS.map((key) => {
        const { Icon, label } = ICON_OPTIONS[key]
        const isActive = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={cn(
              "relative flex aspect-square items-center justify-center rounded-md border transition-all",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {isActive && (
              <Check className="absolute right-0.5 top-0.5 size-2.5 text-primary" strokeWidth={3} />
            )}
          </button>
        )
      })}
    </div>
  )
}
