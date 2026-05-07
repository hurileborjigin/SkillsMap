import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Authentication error
        </h1>
        <p className="mt-3 text-sm text-muted-foreground text-pretty">
          {error ?? "Something went wrong while signing you in. Please try again."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/auth/login">Back to login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
