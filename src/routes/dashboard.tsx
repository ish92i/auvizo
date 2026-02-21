import { createFileRoute, Outlet, useMatches, Link } from "@tanstack/react-router"
import { useUser, useOrganization } from "@clerk/clerk-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout })

function DashboardLayout() {
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
    <TooltipProvider>
      <DashboardLayoutContent />
    </TooltipProvider>
  )
}

function DashboardLayoutContent() {
  const { isSignedIn, isLoaded } = useUser()
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const storeUser = useMutation(api.users.store)
  const storeOrg = useMutation(api.organizations.store)

  const matches = useMatches()
  
  const [orgSynced, setOrgSynced] = useState(false)

  useEffect(() => {
    if (isSignedIn) {
      storeUser()
    }
  }, [isSignedIn, storeUser])

  useEffect(() => {
    const syncOrg = async () => {
      if (organization) {
        await storeOrg({
          clerkOrgId: organization.id,
          name: organization.name,
          slug: organization.slug ?? undefined,
          imageUrl: organization.imageUrl ?? undefined,
        })
        setOrgSynced(true)
      } else if (orgLoaded && !organization) {
        setOrgSynced(true)
      }
    }
    syncOrg()
  }, [organization, orgLoaded, storeOrg])

  const breadcrumbs = matches
    .filter((match) => match.pathname.startsWith("/dashboard"))
    .map((match) => {
      const pathSegments = match.pathname.split("/").filter(Boolean)
      const lastSegment = pathSegments[pathSegments.length - 1]
      const label = lastSegment === "dashboard" 
        ? "Dashboard" 
        : lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
      return {
        path: match.pathname,
        label,
      }
    })
    .filter((item, index, arr) => 
      arr.findIndex(i => i.path === item.path) === index
    )

  if (!isLoaded || !orgLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <p className="text-muted-foreground">
          Please sign in to access the dashboard
        </p>
      </div>
    )
  }

  if (organization && !orgSynced) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Syncing organization...</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.path}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="text-sm">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={crumb.path} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
