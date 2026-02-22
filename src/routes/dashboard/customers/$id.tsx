import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format } from 'date-fns'
import {
  Users,
  Calendar,
  Clock,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/dashboard/customers/$id')({
  component: CustomerDetailsPage,
})

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

function CustomerDetailsPage() {
  const { id } = Route.useParams()
  const customer = useQuery(api.customers.getById, { id: id as any })

  if (customer === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (customer === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Users className="size-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Customer not found</h2>
        <p className="text-sm text-muted-foreground">
          This customer may have been deleted or you don't have access to it.
        </p>
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {customer.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              {customer.email && (
                <div className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {customer.phone}
                </div>
              )}
              {!customer.email && !customer.phone && (
                <span>No contact information</span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeft className="size-4" />
          Back to List
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Contact Information">
          <DetailRow icon={Mail} label="Email" value={customer.email || '—'} />
          <DetailRow icon={Phone} label="Phone" value={customer.phone || '—'} />
        </DetailSection>

        <DetailSection title="Record Information">
          <DetailRow
            icon={Calendar}
            label="Created"
            value={format(customer.createdAt, 'MMMM d, yyyy')}
          />
          <DetailRow
            icon={Clock}
            label="Last Updated"
            value={format(customer.updatedAt, 'MMMM d, yyyy')}
          />
        </DetailSection>
      </div>

      {customer.notes && (
        <DetailSection title="Notes">
          <div className="px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {customer.notes}
            </p>
          </div>
        </DetailSection>
      )}

      {!customer.notes && (
        <DetailSection title="Notes">
          <div className="px-4 py-3 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-2 size-8 opacity-50" />
            No notes added for this customer
          </div>
        </DetailSection>
      )}

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Customer ID:</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {customer._id}
          </code>
        </div>
      </div>
    </div>
  )
}
