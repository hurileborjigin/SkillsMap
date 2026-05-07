import Link from "next/link"
import { ArrowRight, Compass, GitBranch, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HeroGraph } from "@/components/hero-graph"
import { RoleCard } from "@/components/role-card"
import { roles } from "@/lib/data"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <FeaturedRoles />
      <HowItWorks />
      <CallToAction />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:items-center lg:py-28">
        <div className="flex flex-col gap-6">
          <Badge variant="muted" className="self-start font-mono">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Skill graph for engineers</span>
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Understand what it takes to become{" "}
            <span className="text-primary">hireable.</span>
          </h1>
          <p className="text-pretty max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Structured skill trees for modern engineering roles. Map your path, track real progress, and
            stop guessing what to learn next.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/roles">
                Explore roles
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/progress">Start tracking</Link>
            </Button>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6 max-w-md">
            <div className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Roles</dt>
              <dd className="text-2xl font-semibold tracking-tight">5</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Skills</dt>
              <dd className="text-2xl font-semibold tracking-tight">40+</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Open</dt>
              <dd className="text-2xl font-semibold tracking-tight text-success">Free</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <HeroGraph />
          <p className="mt-3 text-xs text-muted-foreground font-mono text-center lg:text-right">
            Live preview — LLM Engineer skill graph
          </p>
        </div>
      </div>
    </section>
  )
}

function FeaturedRoles() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Featured roles
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Pick a role. See exactly what to learn.
            </h2>
            <p className="max-w-2xl text-muted-foreground leading-relaxed">
              Each role is broken down into categories and skills, with importance, descriptions, and
              progress you can actually track.
            </p>
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-end">
            <Link href="/roles">
              View all
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard key={role.slug} role={role} />
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      icon: Compass,
      title: "Choose a role",
      body: "Browse engineering roles and see the categories and skills behind each one — at a glance.",
    },
    {
      icon: GitBranch,
      title: "Track your skills",
      body: "Mark skills as learning or completed. Visualize required vs. optional and see real progress.",
    },
    {
      icon: Target,
      title: "Build structured growth",
      body: "Stop randomly hopping between tutorials. Move along a clear, role-aligned path to hireability.",
    },
  ]
  return (
    <section className="border-b border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-col gap-2 max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            How it works
          </span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps from confused to focused.
          </h2>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-md border border-border bg-muted text-primary">
                  <step.icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CallToAction() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-14">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Now I finally understand what I need to learn.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              That&apos;s the feeling SkillGraph is built for. A clear, structured map of the skills
              behind real engineering roles — without the noise.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/roles">
                  Explore roles
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/roles/llm-engineer">See LLM Engineer</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
