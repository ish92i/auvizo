import { createFileRoute } from "@tanstack/react-router"
import { SignIn } from "@clerk/clerk-react"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/sign-in/$")({ component: SignInCatchAll })

function SignInCatchAll() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
      />
    </div>
  )
}
