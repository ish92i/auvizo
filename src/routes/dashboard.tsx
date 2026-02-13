import { createFileRoute } from "@tanstack/react-router"
import {
  useUser,
  useOrganization,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/clerk-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/dashboard")({ component: DashboardPage })

function DashboardPage() {
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

  return <DashboardContent />
}

function DashboardContent() {
  const { isSignedIn, user, isLoaded } = useUser()
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const convexUser = useQuery(api.users.current)
  const convexOrg = useQuery(api.organizations.current)
  const storeUser = useMutation(api.users.store)
  const storeOrg = useMutation(api.organizations.store)

  useEffect(() => {
    if (isSignedIn) {
      storeUser()
    }
  }, [isSignedIn, storeUser])

  useEffect(() => {
    if (organization) {
      storeOrg({
        clerkOrgId: organization.id,
        name: organization.name,
        slug: organization.slug ?? undefined,
        imageUrl: organization.imageUrl ?? undefined,
      })
    }
  }, [organization, storeOrg])

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
        <p className="text-muted-foreground">Please sign in to access the dashboard</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="fixed top-4 right-4 flex items-center gap-4">
        <OrganizationSwitcher
          appearance={{
            elements: {
              rootBox: "flex items-center",
            },
          }}
        />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-10 w-10",
            },
          }}
        />
      </div>

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

      {orgLoaded && organization && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Your Organization</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {organization.name}
            </p>
            <p>
              <span className="text-muted-foreground">Slug:</span>{" "}
              {organization.slug ?? "N/A"}
            </p>
            <p>
              <span className="text-muted-foreground">Clerk Org ID:</span>{" "}
              <code className="text-xs">{organization.id}</code>
            </p>
            {convexOrg && (
              <p>
                <span className="text-muted-foreground">Convex Org ID:</span>{" "}
                <code className="text-xs">{convexOrg._id}</code>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Members:</span>{" "}
              {organization.membersCount}
            </p>
          </div>
          {organization.imageUrl && (
            <img
              src={organization.imageUrl}
              alt="Organization"
              className="mt-4 h-16 w-16 rounded"
            />
          )}
        </div>
      )}

      {orgLoaded && !organization && (
        <div className="rounded-lg border border-dashed bg-card p-6 text-center">
          <p className="text-muted-foreground">
            No organization selected. Use the switcher above to create or select
            one.
          </p>
        </div>
      )}
    </div>
  )
}
