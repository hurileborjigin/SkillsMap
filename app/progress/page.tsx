import { Badge } from "@/components/ui/badge"
import { ProgressOverview } from "@/components/progress-overview"

export const metadata = {
  title: "My Progress — SkillGraph",
  description: "Track your skill progress across all engineering roles in SkillGraph.",
}

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-3 max-w-3xl">
        <Badge variant="muted" className="self-start font-mono">
          My progress
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Where you are right now.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          A bird&apos;s-eye view of your progress across every role. Click into any role to keep
          building.
        </p>
      </div>
      <div className="mt-12">
        <ProgressOverview />
      </div>
    </div>
  )
}
