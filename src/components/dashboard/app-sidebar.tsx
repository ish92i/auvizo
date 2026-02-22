import * as React from 'react'
import {
  Home,
  Package,
  ShoppingCart,
  Wrench,
  BarChart3,
  Lightbulb,
  Settings,
  LifeBuoy,
  Users,
} from 'lucide-react'

import { NavMain } from '@/components/dashboard/nav-main'
import { NavUser } from '@/components/dashboard/nav-user'
import { OrgSwitcher } from '@/components/dashboard/org-switcher'
import { SidebarSearch } from '@/components/dashboard/sidebar-search'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'

const navItems = [
  {
    title: 'Home',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Equipments',
    url: '/dashboard/equipments',
    icon: Package,
  },
  {
    title: 'Rentals',
    url: '/dashboard/rentals',
    icon: ShoppingCart,
  },
  {
    title: 'Customers',
    url: '/dashboard/customers',
    icon: Users,
  },
  {
    title: 'Maintenance',
    url: '/dashboard/maintenance',
    icon: Wrench,
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Recommendations',
    url: '/dashboard/recommendations',
    icon: Lightbulb,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
        <SidebarSeparator className="mx-0 -mt-1" />
        <SidebarSearch />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <a
          href="mailto:support@auvizo.com"
          className="flex items-center gap-1.5 px-2 py-0.5 text-base text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:justify-center"
        >
          <LifeBuoy className="size-5 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Support</span>
        </a>
        <SidebarSeparator className="mx-0 mt-0" />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
