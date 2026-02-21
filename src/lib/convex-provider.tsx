'use client'

import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { type ReactNode } from 'react'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
})

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  if (!clerkPubKey) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Missing Clerk configuration</p>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
