import { createFileRoute } from "@tanstack/react-router"
import { SignUp } from "@clerk/clerk-react"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/sign-up")({ component: SignUpPage })

function SignUpPage() {
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
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
      />
    </div>
  )
}
