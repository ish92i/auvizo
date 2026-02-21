import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format } from 'date-fns'
import {
  Package,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft,
  Tag,
} from 'lucide-react'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/dashboard/equipment/$id')({
  component: EquipmentDetailsPage,
})

type EquipmentStatus = 'available' | 'rented' | 'maintenance'
type EquipmentCategory =
  | 'earthmoving'
  | 'mewp'
  | 'material_handling'
  | 'power_generation'
  | 'air_compressors'
  | 'lawn_garden'
  | 'compaction_paving'
  | 'concrete_masonry'
  | 'lighting'
  | 'trucks_transportation'

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  earthmoving: 'Earthmoving',
  mewp: 'MEWP',
  material_handling: 'Material Handling',
  power_generation: 'Power Generation',
  air_compressors: 'Air Compressors',
  lawn_garden: 'Lawn & Garden',
  compaction_paving: 'Compaction & Paving',
  concrete_masonry: 'Concrete & Masonry',
  lighting: 'Lighting',
  trucks_transportation: 'Trucks & Transportation',
}

const STATUS_CONFIG: Record<
  EquipmentStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline'; color: string }
> = {
  available: {
    label: 'Available',
    variant: 'default',
    color: 'text-primary',
  },
  rented: {
    label: 'Rented',
    variant: 'secondary',
    color: 'text-blue-500',
  },
  maintenance: {
    label: 'Maintenance',
    variant: 'outline',
    color: 'text-amber-500',
  },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="rounded-xl border bg-card">{children}</div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between border-b px-4 py-3 last:border-0 ${className}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-4" />}
        <span className="text-sm">{label}</span>
      </div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}

function EquipmentDetailsPage() {
  const { id } = Route.useParams()
  const equipment = useQuery(api.equipment.getById, { id: id as any })

  if (equipment === undefined) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/equipments">
                    Equipments
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Loading...</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <LoadingSkeleton />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (equipment === null) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/equipments">
                    Equipments
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Not Found</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <Package className="size-16 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold">Equipment not found</h2>
            <p className="text-sm text-muted-foreground">
              This equipment may have been deleted or you don't have access to
              it.
            </p>
            <Button variant="outline" onClick={() => history.back()}>
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/equipments">
                  Equipments
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{equipment.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                <Package className="size-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {equipment.name}
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={STATUS_CONFIG[equipment.status].variant}>
                    {STATUS_CONFIG[equipment.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[equipment.category]}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => history.back()}>
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DetailSection title="Basic Information">
              <DetailRow
                icon={Tag}
                label="Category"
                value={CATEGORY_LABELS[equipment.category]}
              />
              <DetailRow
                icon={Package}
                label="Status"
                value={
                  <span className={STATUS_CONFIG[equipment.status].color}>
                    {STATUS_CONFIG[equipment.status].label}
                  </span>
                }
              />
              <DetailRow
                icon={Calendar}
                label="Created"
                value={format(equipment.createdAt, 'MMMM d, yyyy')}
              />
              <DetailRow
                icon={Clock}
                label="Last Updated"
                value={format(equipment.updatedAt, 'MMMM d, yyyy')}
              />
            </DetailSection>

            <DetailSection title="Financial & Usage">
              <DetailRow
                icon={DollarSign}
                label="Asset Value"
                value={
                  <span className="text-lg">
                    {formatCurrency(equipment.assetValue)}
                  </span>
                }
              />
              <DetailRow
                icon={Clock}
                label="Total Hours Used"
                value={
                  <span className="text-lg">
                    {equipment.totalHoursUsed?.toLocaleString() ?? '0'} hrs
                  </span>
                }
              />
            </DetailSection>
          </div>

          {equipment.notes && (
            <DetailSection title="Notes">
              <div className="px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {equipment.notes}
                </p>
              </div>
            </DetailSection>
          )}

          {!equipment.notes && (
            <DetailSection title="Notes">
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2 size-8 opacity-50" />
                No notes added for this equipment
              </div>
            </DetailSection>
          )}

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Equipment ID:</span>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {equipment._id}
              </code>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
