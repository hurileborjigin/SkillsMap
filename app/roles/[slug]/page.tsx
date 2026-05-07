import { notFound } from "next/navigation"
import { getRoleBySlug, roles } from "@/lib/data"
import { RoleDetailView } from "@/components/role-detail-view"

export function generateStaticParams() {
  return roles.map((role) => ({ slug: role.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const role = getRoleBySlug(slug)
  if (!role) return { title: "Role not found — SkillGraph" }
  return {
    title: `${role.name} — SkillGraph`,
    description: role.longDescription,
  }
}

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const role = getRoleBySlug(slug)
  if (!role) notFound()
  return <RoleDetailView role={role} />
}
