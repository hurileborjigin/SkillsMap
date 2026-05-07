"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Compass } from "lucide-react"
import { useRoleBySlug } from "@/lib/progress-store"
import { RoleDetailView } from "@/components/role-detail-view"
import { Button } from "@/components/ui/button"

export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const role = useRoleBySlug(slug)

  if (!role) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 py-24 md:px-6">
        <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          <Compass className="size-5" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Role not found</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t find a role with the slug{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{slug}</code>.
            It may have been removed.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/roles">
            <ArrowLeft />
            Back to all roles
          </Link>
        </Button>
      </div>
    )
  }

  return <RoleDetailView role={role} />
}
