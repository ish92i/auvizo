import { useRef } from "react"
import { UserButton, useUser } from "@clerk/clerk-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
  const { user } = useUser()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const containerRef = useRef<HTMLDivElement>(null)

  if (!user) {
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    const clerkButton = containerRef.current?.querySelector(
      "[data-clerk-component] button, .cl-userButtonTrigger"
    ) as HTMLButtonElement | null
    if (clerkButton && e.target !== clerkButton && !clerkButton.contains(e.target as Node)) {
      clerkButton.click()
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div ref={containerRef}>
          <SidebarMenuButton
            size="lg"
            className="cursor-pointer"
            onClick={handleClick}
          >
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                  userButtonTrigger: "focus:shadow-none focus:outline-none",
                },
              }}
            />
            {!isCollapsed && (
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.fullName ?? user.firstName ?? "User"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            )}
          </SidebarMenuButton>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
