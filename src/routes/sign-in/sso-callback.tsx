import { createFileRoute } from "@tanstack/react-router"
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/sign-in/sso-callback")({
  component: SSOCallback,
})

function SSOCallback() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    )
  }

  return <AuthenticateWithRedirectCallback />
}
