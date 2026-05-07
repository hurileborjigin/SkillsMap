"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useAppStore } from "@/lib/progress-store"
import type { Difficulty, IconKey } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconPicker } from "@/components/icon-picker"
import { cn } from "@/lib/utils"

const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"]

export default function NewRolePage() {
  const router = useRouter()
  const { createRole } = useAppStore()

  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate")
  const [iconKey, setIconKey] = useState<IconKey>("custom")

  const canSubmit = name.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const role = createRole({
      name,
      shortDescription,
      longDescription,
      difficulty,
      iconKey,
    })
    // Send the user straight into the editor so they can build out the track.
    router.push(`/roles/${role.slug}/edit`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/roles">
          <ArrowLeft />
          All roles
        </Link>
      </Button>

      <header className="mt-4 flex flex-col gap-3">
        <Badge variant="muted" className="self-start font-mono">
          <Sparkles className="size-3" />
          New role
        </Badge>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Define a new role.
        </h1>
        <p className="text-pretty text-muted-foreground leading-relaxed">
          Give your role a name and a short description. You&apos;ll be able to add tracks,
          categories, and skills next.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <Label>Icon</Label>
          <IconPicker value={iconKey} onChange={setIconKey} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-name">Role name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AI Research Engineer"
            autoFocus
            required
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll generate a URL slug from this. You can edit it later.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-short">Short description</Label>
          <Input
            id="role-short"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="One sentence shown on the role card."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-long">Long description</Label>
          <Textarea
            id="role-long"
            rows={4}
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            placeholder="A longer overview shown at the top of the role page."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Difficulty</Label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDifficulty(opt)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  difficulty === opt
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={difficulty === opt}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-6">
          <Button asChild variant="ghost">
            <Link href="/roles">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            Create role
          </Button>
        </div>
      </form>
    </div>
  )
}
