"use client"

import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"
import { useState, useEffect, type ReactNode } from "react"

const convexUrl = import.meta.env.VITE_CONVEX_URL as string
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [convex] = useState(() =>
    typeof window !== "undefined" && convexUrl
      ? new ConvexReactClient(convexUrl)
      : null
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !convex || !clerkPubKey) {
    return <>{children}</>
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
