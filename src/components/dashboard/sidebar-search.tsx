import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"
import { SearchCommand } from "@/components/dashboard/search-command"

export function SidebarSearch() {
  const [open, setOpen] = React.useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group flex items-center gap-2 rounded-lg border border-input/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground hover:border-input",
          isCollapsed && "justify-center px-2"
        )}
      >
        <SearchIcon className="size-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">Search...</span>
            <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
          </>
        )}
      </button>
      <SearchCommand open={open} onOpenChange={setOpen} />
    </>
  )
}
