import { useState } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (title: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = (item.url && location.pathname === item.url) || item.isActive
          const hasSubItems = item.items && item.items.length > 0
          const isExpanded = expandedItems.has(item.title)

          return (
            <SidebarMenuItem key={item.title}>
              {hasSubItems ? (
                <>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => toggleExpand(item.title)}
                    className="cursor-pointer"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className={`ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </SidebarMenuButton>
                  {isExpanded && (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubActive = location.pathname === subItem.url
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              tooltip={subItem.title}
                              isActive={isSubActive}
                              render={<Link to={subItem.url} />}
                            >
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  render={item.url ? <Link to={item.url} /> : undefined}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
