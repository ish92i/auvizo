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
  ClipboardCheck,
  Wrench,
  AlertCircle,
} from 'lucide-react'

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

type InspectionType = 'pre_rental' | 'post_rental' | 'routine'
type OverallCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
type MaintenanceStatus = 'pending' | 'in_progress' | 'completed'

const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  pre_rental: 'Pre-Rental',
  post_rental: 'Post-Rental',
  routine: 'Routine',
}

const CONDITION_CONFIG: Record<
  OverallCondition,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
  }
> = {
  excellent: { label: 'Excellent', variant: 'default' },
  good: { label: 'Good', variant: 'secondary' },
  fair: { label: 'Fair', variant: 'outline' },
  poor: { label: 'Poor', variant: 'outline' },
  damaged: { label: 'Damaged', variant: 'destructive' },
}

const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
  }
> = {
  pending: { label: 'Pending', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
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
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3 last:border-0">
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
  const data = useQuery(api.equipment.getWithMaintenanceHistory, {
    id: id as any,
  })

  if (data === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Package className="size-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Equipment not found</h2>
        <p className="text-sm text-muted-foreground">
          This equipment may have been deleted or you don't have access to it.
        </p>
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const { equipment, inspections, maintenanceRecords } = data

  return (
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

      <DetailSection title="Inspection History">
        {inspections.length > 0 ? (
          <div className="divide-y">
            {inspections.map((inspection) => (
              <div
                key={inspection._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <ClipboardCheck className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {INSPECTION_TYPE_LABELS[inspection.type]} Inspection
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          CONDITION_CONFIG[inspection.overallCondition].variant
                        }
                      >
                        {CONDITION_CONFIG[inspection.overallCondition].label}
                      </Badge>
                      {inspection.damageFound && (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="size-3" />
                          Damage found
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(inspection.inspectedAt, 'MMM d, yyyy')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <ClipboardCheck className="mx-auto mb-2 size-8 opacity-50" />
            No inspection history available
          </div>
        )}
      </DetailSection>

      <DetailSection title="Maintenance History">
        {maintenanceRecords.length > 0 ? (
          <div className="divide-y">
            {maintenanceRecords.map((record) => (
              <div
                key={record._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Wrench className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{record.workOrder}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          MAINTENANCE_STATUS_CONFIG[record.status].variant
                        }
                      >
                        {MAINTENANCE_STATUS_CONFIG[record.status].label}
                      </Badge>
                      {record.cost !== undefined && record.cost > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(record.cost)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {record.completedAt
                    ? format(record.completedAt, 'MMM d, yyyy')
                    : format(record.createdAt, 'MMM d, yyyy')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <Wrench className="mx-auto mb-2 size-8 opacity-50" />
            No maintenance history available
          </div>
        )}
      </DetailSection>

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Equipment ID:</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {equipment._id}
          </code>
        </div>
      </div>
    </div>
  )
}
