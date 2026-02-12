import { createFileRoute, Link } from "@tanstack/react-router"
import { useUser, SignOutButton, useClerk } from "@clerk/clerk-react"
import { useQuery, useMutation, useConvex } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
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

  return <HomePageContent />
}

function HomePageContent() {
  const { isSignedIn, user, isLoaded } = useUser()
  const convexUser = useQuery(api.users.current)
  const storeUser = useMutation(api.users.store)

  useEffect(() => {
    if (isSignedIn) {
      storeUser()
    }
  }, [isSignedIn, storeUser])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <h1 className="text-4xl font-bold">Welcome to Auvizo</h1>
        <p className="text-muted-foreground">Please sign in to continue</p>
        <Link
          to="/sign-in"
          className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-6xl font-bold">GGs 🎉</h1>
      <p className="text-xl text-muted-foreground">You're authenticated!</p>

      <div className="mt-4 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Your Profile</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            {user?.fullName ?? "N/A"}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p>
            <span className="text-muted-foreground">Clerk ID:</span>{" "}
            <code className="text-xs">{user?.id}</code>
          </p>
          {convexUser && (
            <p>
              <span className="text-muted-foreground">Convex User ID:</span>{" "}
              <code className="text-xs">{convexUser._id}</code>
            </p>
          )}
        </div>
        {user?.imageUrl && (
          <img
            src={user.imageUrl}
            alt="Profile"
            className="mt-4 h-16 w-16 rounded-full"
          />
        )}
      </div>

      <SignOutButton>
        <button className="mt-4 rounded-md border px-4 py-2 hover:bg-accent">
          Sign Out
        </button>
      </SignOutButton>
    </div>
  )
}
