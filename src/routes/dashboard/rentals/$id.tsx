import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft,
  Package,
  User,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/dashboard/rentals/$id')({
  component: RentalDetailsPage,
})

type RentalStatus = 'active' | 'returned' | 'overdue'

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
  RentalStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
    color: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  active: {
    label: 'Active',
    variant: 'default',
    color: 'text-primary',
    icon: Clock,
  },
  returned: {
    label: 'Returned',
    variant: 'secondary',
    color: 'text-green-600',
    icon: CheckCircle,
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    color: 'text-destructive',
    icon: AlertTriangle,
  },
}

function getRentalStatus(rental: {
  endDate: number
  returnDate?: number
}): RentalStatus {
  if (rental.returnDate) return 'returned'
  if (Date.now() > rental.endDate) return 'overdue'
  return 'active'
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

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

function RentalDetailsPage() {
  const { id } = Route.useParams()
  const rental = useQuery(api.rentals.getById, { id: id as any })
  const markReturned = useMutation(api.rentals.markReturned)

  const handleMarkReturned = async () => {
    await markReturned({ id: id as any })
  }

  if (rental === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (rental === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Package className="size-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Rental not found</h2>
        <p className="text-sm text-muted-foreground">
          This rental may have been deleted or you don't have access to it.
        </p>
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const status = getRentalStatus(rental)
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  const rentalDays = Math.ceil(
    ((rental.returnDate ?? Date.now()) - rental.startDate) / MS_PER_DAY,
  )
  const totalCost = Math.max(1, rentalDays) * rental.dailyRate

  const canMarkReturned = status === 'active' || status === 'overdue'

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="size-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {rental.equipment?.name ?? 'Unknown Equipment'}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={statusConfig.variant}>
                <StatusIcon className="size-3" />
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {rental.customer?.name ?? 'Unknown Customer'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canMarkReturned && (
            <Button onClick={handleMarkReturned}>
              <CheckCircle className="size-4" />
              Mark as Returned
            </Button>
          )}
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft className="size-4" />
            Back to List
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Rental Information">
          <DetailRow
            icon={Calendar}
            label="Start Date"
            value={format(rental.startDate, 'MMMM d, yyyy')}
          />
          <DetailRow
            icon={Calendar}
            label="End Date"
            value={format(rental.endDate, 'MMMM d, yyyy')}
          />
          {rental.returnDate && (
            <DetailRow
              icon={CheckCircle}
              label="Return Date"
              value={format(rental.returnDate, 'MMMM d, yyyy')}
            />
          )}
          <DetailRow
            icon={Clock}
            label="Duration"
            value={`${rentalDays} day${rentalDays !== 1 ? 's' : ''}`}
          />
        </DetailSection>

        <DetailSection title="Financial Details">
          <DetailRow
            icon={DollarSign}
            label="Daily Rate"
            value={
              <span className="text-lg">
                {formatCurrency(rental.dailyRate)}
              </span>
            }
          />
          <DetailRow
            icon={DollarSign}
            label="Total Cost"
            value={
              <span className="text-lg font-bold text-primary">
                {formatCurrency(totalCost)}
              </span>
            }
          />
          <DetailRow
            icon={Clock}
            label="Created"
            value={format(rental.createdAt, 'MMMM d, yyyy')}
          />
        </DetailSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Equipment Details">
          {rental.equipment ? (
            <>
              <DetailRow
                icon={Package}
                label="Name"
                value={
                  <Link
                    to="/dashboard/equipment/$id"
                    params={{ id: rental.equipmentId }}
                    className="text-primary hover:underline"
                  >
                    {rental.equipment.name}
                  </Link>
                }
              />
              <DetailRow
                icon={Package}
                label="Category"
                value={CATEGORY_LABELS[rental.equipment.category]}
              />
              <DetailRow
                icon={DollarSign}
                label="Asset Value"
                value={formatCurrency(rental.equipment.assetValue)}
              />
            </>
          ) : (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground">
              <Package className="mx-auto mb-2 size-8 opacity-50" />
              Equipment not found
            </div>
          )}
        </DetailSection>

        <DetailSection title="Customer Details">
          {rental.customer ? (
            <>
              <DetailRow
                icon={User}
                label="Name"
                value={rental.customer.name}
              />
              {rental.customer.email && (
                <DetailRow
                  icon={User}
                  label="Email"
                  value={
                    <a
                      href={`mailto:${rental.customer.email}`}
                      className="text-primary hover:underline"
                    >
                      {rental.customer.email}
                    </a>
                  }
                />
              )}
              {rental.customer.phone && (
                <DetailRow
                  icon={User}
                  label="Phone"
                  value={
                    <a
                      href={`tel:${rental.customer.phone}`}
                      className="text-primary hover:underline"
                    >
                      {rental.customer.phone}
                    </a>
                  }
                />
              )}
              {!rental.customer.email && !rental.customer.phone && (
                <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                  No contact information
                </div>
              )}
            </>
          ) : (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground">
              <User className="mx-auto mb-2 size-8 opacity-50" />
              Customer not found
            </div>
          )}
        </DetailSection>
      </div>

      {rental.notes && (
        <DetailSection title="Notes">
          <div className="px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {rental.notes}
            </p>
          </div>
        </DetailSection>
      )}

      {!rental.notes && (
        <DetailSection title="Notes">
          <div className="px-4 py-3 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-2 size-8 opacity-50" />
            No notes added for this rental
          </div>
        </DetailSection>
      )}

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rental ID:</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {rental._id}
          </code>
        </div>
      </div>
    </div>
  )
}
