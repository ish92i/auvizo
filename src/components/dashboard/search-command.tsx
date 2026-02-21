import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  Home,
  Package,
  ShoppingCart,
  Wrench,
  BarChart3,
  Lightbulb,
  Settings,
  PackagePlus,
  CalendarPlus,
  BookOpen,
  LifeBuoy,
} from "lucide-react"

import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command"

const pages = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
    shortcut: "H",
  },
  {
    title: "Equipments",
    url: "/dashboard/equipments",
    icon: Package,
    shortcut: "E",
  },
  {
    title: "Rentals",
    url: "/dashboard/rentals",
    icon: ShoppingCart,
    shortcut: "R",
  },
  {
    title: "Customers",
    url: "/dashboard/rentals/customers",
    icon: ShoppingCart,
    shortcut: "C",
  },
  {
    title: "Maintenance",
    url: "/dashboard/maintenance",
    icon: Wrench,
    shortcut: "M",
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    shortcut: "A",
  },
  {
    title: "Recommendations",
    url: "/dashboard/recommendations",
    icon: Lightbulb,
    shortcut: "X",
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    shortcut: "S",
  },
]

const actions = [
  {
    title: "Add new equipment",
    icon: PackagePlus,
  },
  {
    title: "Create rental",
    icon: CalendarPlus,
  },
  {
    title: "View documentation",
    icon: BookOpen,
  },
  {
    title: "Get help",
    icon: LifeBuoy,
  },
]

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const navigate = useNavigate()

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false)
      command()
    },
    [onOpenChange]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search for pages, actions, and more..."
    >
      <Command className="rounded-none border-none">
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.url}
                onSelect={() => runCommand(() => navigate({ to: page.url }))}
              >
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.title}</span>
                <CommandShortcut>{page.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            {actions.map((action) => (
              <CommandItem key={action.title} onSelect={() => onOpenChange(false)}>
                <action.icon className="mr-2 h-4 w-4" />
                <span>{action.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
