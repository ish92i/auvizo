import { createFileRoute, Link } from "@tanstack/react-router"
import { useUser } from "@clerk/clerk-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: LandingPage })

function LandingPage() {
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

  return <LandingContent />
}

function LandingContent() {
  const { isSignedIn, isLoaded } = useUser()

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.5_0.07_150/0.15),transparent)]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Auvizo</span>
        </div>

        <div className="flex items-center gap-3">
          {isLoaded && isSignedIn ? (
            <Link to="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-32 text-center md:pt-32 lg:pt-40">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Now in beta
        </div>

        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Build something
          <br />
          <span className="text-primary">extraordinary</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
          A modern platform designed to help you ship faster, collaborate better,
          and focus on what matters most.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to={isSignedIn ? "/dashboard" : "/sign-up"}>
            <Button className="h-11 px-8 text-base">
              {isSignedIn ? "Go to Dashboard" : "Start for free"}
            </Button>
          </Link>
          <Button variant="outline" className="h-11 px-8 text-base">
            Learn more
          </Button>
        </div>
      </main>

      {/* Feature grid */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Fast by default"
            description="Optimized for speed with real-time sync and instant updates across all your devices."
          />
          <FeatureCard
            title="Built for teams"
            description="Collaborate seamlessly with your team. Shared workspaces, roles, and permissions."
          />
          <FeatureCard
            title="Secure & reliable"
            description="Enterprise-grade security with end-to-end encryption and 99.9% uptime SLA."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 Auvizo. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-border hover:bg-card hover:shadow-md">
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
