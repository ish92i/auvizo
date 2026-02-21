import { createFileRoute, Link } from "@tanstack/react-router"
import { useUser } from "@clerk/clerk-react"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  Gauge,
  DollarSign,
  AlertTriangle,
  Activity,
} from "lucide-react"

export const Route = createFileRoute("/")({ component: LandingPage })

function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <LandingContent />
}

function useCountUp(end: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  useEffect(() => {
    if (!started) return
    
    let startTime: number
    let animationFrame: number
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, started])
  
  return count
}

function LandingContent() {
  const { isSignedIn, isLoaded } = useUser()

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Grain overlay */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.015] mix-blend-multiply"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
      
      {/* Atmospheric gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_100%_at_0%_0%,oklch(0.45_0.08_150/0.08),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_100%,oklch(0.55_0.06_85/0.06),transparent_50%)]" />
      
      {/* Grid pattern */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.3 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.3 0 0) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link to="/" className="group flex items-center gap-2 transition-opacity hover:opacity-80">
            <img 
              src="/logo-text.png" 
              alt="Auvizo" 
              className="h-6"
            />
          </Link>

          <div className="flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <Link to="/dashboard">
                <Button size="sm" className="gap-2 font-medium">
                  Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Sign in
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button size="sm" className="gap-2 font-medium">
                    Start Free
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24 lg:px-8 lg:pt-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left: Copy */}
          <div className="flex flex-col justify-center lg:col-span-6">
            {/* Badge with animation */}
            <div 
              className="animate-in fade-in slide-in-from-bottom-3 duration-700 mb-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
              style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Now in Beta — Early Access
            </div>

            {/* Headline with staggered animation */}
            <h1 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl"
              style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
            >
              Stop guessing.
              <br />
              <span className="bg-gradient-to-r from-primary via-chart-3 to-primary bg-clip-text text-transparent">
                Start growing.
              </span>
            </h1>

            <p 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground lg:text-xl"
              style={{ animationDelay: '350ms', animationFillMode: 'backwards' }}
            >
              Fleet intelligence for rental companies running{" "}
              <span className="font-semibold text-foreground">$500K–$5M</span> in equipment. 
              Know exactly which assets make money.
            </p>

            {/* Stats row */}
            <div 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8 flex flex-wrap items-center gap-6"
              style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}
            >
              <StatHighlight value={15} suffix="–30%" label="Revenue increase" />
              <div className="h-10 w-px bg-border/50" />
              <StatHighlight value={90} suffix=" days" label="To see results" />
              <div className="hidden h-10 w-px bg-border/50 sm:block" />
              <StatHighlight value={10} suffix=" min" label="Daily admin" className="hidden sm:flex" />
            </div>

            {/* CTA */}
            <div 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              style={{ animationDelay: '650ms', animationFillMode: 'backwards' }}
            >
              <Link to={isSignedIn ? "/dashboard" : "/sign-up"}>
                <Button size="lg" className="group h-13 gap-2.5 px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                  {isSignedIn ? "Go to Dashboard" : "Start Free Trial"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary/70" />
                No credit card required
              </span>
            </div>
          </div>

          {/* Right: Live Dashboard Preview */}
          <div 
            className="animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-1000 relative flex items-center justify-center lg:col-span-6"
            style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
          >
            <div className="relative w-full max-w-lg">
              {/* Glow effect */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-chart-2/20 opacity-60 blur-2xl" />
              
              {/* Dashboard card */}
              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive/70" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                    <div className="h-3 w-3 rounded-full bg-primary/70" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-xs font-medium text-muted-foreground">Fleet Overview</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5 space-y-5">
                  {/* Live utilization meter */}
                  <LiveUtilizationMeter />

                  {/* Equipment list with animations */}
                  <div className="space-y-2.5">
                    <EquipmentRow 
                      name="CAT 320 Excavator" 
                      status="deployed" 
                      utilization={92} 
                      revenue="+$4,200"
                      delay={800}
                    />
                    <EquipmentRow 
                      name="JCB 3CX Backhoe" 
                      status="deployed" 
                      utilization={67} 
                      revenue="+$2,100"
                      delay={900}
                    />
                    <EquipmentRow 
                      name="Bobcat S650" 
                      status="idle" 
                      utilization={23} 
                      revenue="-$800"
                      warning
                      delay={1000}
                    />
                  </div>

                  {/* AI Insight */}
                  <InsightCard delay={1100} />
                </div>
              </div>

              {/* Floating mini cards */}
              <FloatingCard 
                className="-right-6 top-16 sm:-right-10"
                delay={1200}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-foreground">+23%</div>
                    <div className="text-[10px] text-muted-foreground">This month</div>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard 
                className="-left-4 bottom-24 sm:-left-8"
                delay={1400}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-foreground">3</div>
                    <div className="text-[10px] text-muted-foreground">Need attention</div>
                  </div>
                </div>
              </FloatingCard>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="relative border-y border-border/30 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mb-14 text-center">
            <p className="mb-4 font-mono text-sm font-semibold uppercase tracking-widest text-primary">
              The Problem
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Sound familiar?
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <PainCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Drowning in spreadsheets"
              description="Hours of manual data entry. Formulas breaking constantly. Zero real-time visibility."
              delay={100}
            />
            <PainCard
              icon={<Gauge className="h-5 w-5" />}
              title="Gut-feeling decisions"
              description="Making million-dollar equipment purchases on intuition because you don't have the data."
              delay={200}
            />
            <PainCard
              icon={<DollarSign className="h-5 w-5" />}
              title="Money left on the table"
              description="Equipment sitting idle in your yard burning capital while opportunities pass by."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mb-16 max-w-2xl">
          <p className="mb-4 font-mono text-sm font-semibold uppercase tracking-widest text-primary">
            The Auvizo Difference
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Enterprise intelligence.
            <br />
            <span className="text-muted-foreground">Without the enterprise price.</span>
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Clock className="h-5 w-5" />}
            metric="2 hrs → 10 min"
            title="Admin time slashed"
            description="Replace error-prone spreadsheets with dead-simple mobile tracking."
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            metric="100%"
            title="Utilization clarity"
            description="Know exactly which excavator pays for itself and which should be sold."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            metric="0"
            title="Implementation friction"
            description="No consultants. No 6-month onboarding. Just answers, immediately."
          />
        </div>
      </section>

      {/* Results Section */}
      <section className="relative border-y border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-chart-2/[0.03]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="mb-4 font-mono text-sm font-semibold uppercase tracking-widest text-primary">
                The Bottom Line
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                See your business{" "}
                <span className="underline decoration-primary/40 decoration-4 underline-offset-4">clearly</span>.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Our customers see <span className="font-semibold text-foreground">15-30% revenue increases</span> within 
                90 days—not from working harder, but from finally seeing their business clearly.
              </p>
              
              <div className="mt-10 space-y-4">
                <ResultItem text="Know which equipment makes money vs. burns capital" delay={0} />
                <ResultItem text="Identify idle assets before they cost you" delay={100} />
                <ResultItem text="Make data-driven purchasing decisions" delay={200} />
                <ResultItem text="Track everything from your phone" delay={300} />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="grid grid-cols-2 gap-5">
                <BigStatCard value="15-30" suffix="%" label="Revenue increase" />
                <BigStatCard value="90" suffix=" days" label="To see results" />
                <BigStatCard value="10" suffix=" min" label="Daily admin" />
                <BigStatCard value="$0" label="Setup fees" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-chart-3 to-primary" />
          
          {/* Pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
          
          <div className="relative px-8 py-16 text-center md:px-16 md:py-20">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
              Ready to see your fleet clearly?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/85">
              Join rental companies who stopped guessing and started growing. 
              Setup takes 10 minutes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={isSignedIn ? "/dashboard" : "/sign-up"}>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="group h-13 gap-2.5 px-8 text-base font-semibold shadow-xl"
                >
                  {isSignedIn ? "Go to Dashboard" : "Start Your Free Trial"}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/70">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <img src="/logo-text.png" alt="Auvizo" className="h-5" />
            </div>
            <div className="flex flex-col gap-4 text-sm md:flex-row md:items-center md:gap-8">
              <a href="mailto:hello@auvizo.com" className="text-muted-foreground transition-colors hover:text-foreground">
                hello@auvizo.com
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                Terms
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border/30 pt-6 text-center text-sm text-muted-foreground">
            © 2026 Auvizo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatHighlight({ 
  value, 
  suffix = "", 
  label,
  className = ""
}: { 
  value: number
  suffix?: string
  label: string
  className?: string
}) {
  const count = useCountUp(value, 1500, 800)
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div>
        <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
          {count}{suffix}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function LiveUtilizationMeter() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(78)
    }, 600)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Fleet Utilization</span>
        <span className="font-mono text-sm font-bold text-primary">{progress}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function EquipmentRow({ 
  name, 
  status, 
  utilization, 
  revenue, 
  warning = false,
  delay = 0
}: { 
  name: string
  status: "deployed" | "idle"
  utilization: number
  revenue: string
  warning?: boolean
  delay?: number
}) {
  return (
    <div 
      className={`animate-in fade-in slide-in-from-right-2 duration-500 flex items-center justify-between rounded-lg border px-3.5 py-2.5 transition-all hover:bg-background ${
        warning 
          ? "border-amber-500/30 bg-amber-500/5" 
          : "border-border/40 bg-background/50"
      }`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${
          status === "deployed" ? "bg-primary" : "bg-amber-500 animate-pulse"
        }`} />
        <span className="text-sm font-medium text-foreground">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="h-1 w-8 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-primary/60" 
              style={{ width: `${utilization}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground w-8">{utilization}%</span>
        </div>
        <span className={`font-mono text-xs font-semibold ${
          revenue.startsWith("+") ? "text-primary" : "text-amber-600 dark:text-amber-400"
        }`}>
          {revenue}/mo
        </span>
      </div>
    </div>
  )
}

function InsightCard({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20">
          <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            Action Required
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-600/80 dark:text-amber-400/80">
            Bobcat S650 idle for 18 days. Consider repositioning.
          </p>
        </div>
      </div>
    </div>
  )
}

function FloatingCard({ 
  children, 
  className = "",
  delay = 0
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <div 
      className={`animate-in fade-in zoom-in-90 duration-500 absolute rounded-xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur-sm ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      {children}
    </div>
  )
}

function PainCard({ 
  icon, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
}) {
  return (
    <div className="group rounded-xl border border-border/40 bg-card/30 p-6 transition-all hover:border-border hover:bg-card/60">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  metric,
  title, 
  description 
}: { 
  icon: React.ReactNode
  metric: string
  title: string
  description: string 
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 p-6 transition-all hover:border-primary/30 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-mono text-2xl font-bold text-foreground">{metric}</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function ResultItem({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-4 w-4 text-primary" />
      </div>
      <span className="text-foreground">{text}</span>
    </div>
  )
}

function BigStatCard({ value, suffix = "", label }: { value: string | number; suffix?: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-card/60 p-6 text-center shadow-sm transition-all hover:border-border hover:bg-card hover:shadow-md">
      <div className="font-mono text-3xl font-bold tracking-tight text-primary lg:text-4xl">
        {value}{suffix}
      </div>
      <div className="mt-1.5 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
