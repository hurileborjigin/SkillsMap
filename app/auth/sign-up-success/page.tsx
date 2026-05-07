import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full border border-border bg-card">
          <MailCheck className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-muted-foreground text-pretty">
          We&apos;ve sent you a confirmation link. Click it to activate your
          account, then come back and log in.
        </p>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/auth/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
