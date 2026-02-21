import { createFileRoute } from "@tanstack/react-router"
import { useUser, useOrganization } from "@clerk/clerk-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/dashboard/")({ component: DashboardIndexPage })

function DashboardIndexPage() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const convexUser = useQuery(api.users.current)
  const convexOrg = useQuery(api.organizations.current)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName ?? "there"}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your account today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            Your Profile
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="size-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{user?.fullName ?? "N/A"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            {convexUser && (
              <p className="text-xs text-muted-foreground">
                Convex ID:{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {convexUser._id}
                </code>
              </p>
            )}
          </div>
        </div>

        {organization && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">
              Organization
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                {organization.imageUrl && (
                  <img
                    src={organization.imageUrl}
                    alt="Organization"
                    className="size-12 rounded-lg"
                  />
                )}
                <div>
                  <p className="font-medium">{organization.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {organization.membersCount} member
                    {organization.membersCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              {convexOrg && (
                <p className="text-xs text-muted-foreground">
                  Convex ID:{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    {convexOrg._id}
                  </code>
                </p>
              )}
            </div>
          </div>
        )}

        {!organization && (
          <div className="rounded-xl border border-dashed bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Organization
            </h3>
            <p className="mt-4 text-sm text-muted-foreground">
              No organization selected. Use the switcher in the sidebar to
              create or select one.
            </p>
          </div>
        )}

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            Quick Stats
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Projects</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full rounded-xl border bg-muted/50 p-6 lg:col-span-2">
          <h3 className="font-medium">Recent Activity</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No recent activity to display.
          </p>
        </div>
        <div className="rounded-xl border bg-muted/50 p-6">
          <h3 className="font-medium">Notifications</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You're all caught up!
          </p>
        </div>
      </div>
    </div>
  )
}
