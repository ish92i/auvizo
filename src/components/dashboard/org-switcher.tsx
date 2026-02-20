import { OrganizationSwitcher } from "@clerk/clerk-react"

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"

export function OrgSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="[&_.cl-organizationSwitcherTrigger]:w-full [&_.cl-organizationSwitcherTrigger]:justify-start [&_.cl-organizationSwitcherTrigger]:gap-2 [&_.cl-organizationSwitcherTrigger]:rounded-md [&_.cl-organizationSwitcherTrigger]:p-2 [&_.cl-organizationSwitcherTrigger]:hover:bg-sidebar-accent [&_.cl-organizationSwitcherTrigger]:focus:outline-none [&_.cl-organizationSwitcherTrigger]:focus:ring-0 [&_.cl-avatarBox]:size-8 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:[&_.cl-organizationSwitcherTrigger]:p-0 group-data-[collapsible=icon]:[&_.cl-organizationSwitcherTrigger]:justify-center group-data-[collapsible=icon]:[&_.cl-organizationSwitcherTriggerIcon]:hidden">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationPreviewMainIdentifier:
                  "truncate font-medium text-sidebar-foreground text-sm",
                organizationPreviewSecondaryIdentifier:
                  "truncate text-xs text-muted-foreground",
              },
            }}
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
