import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format } from 'date-fns'
import { AlertTriangle, Clock, ClipboardCheck, Wrench } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type InspectionQueueProps = {
  onStartInspection: (
    equipmentId: string,
    rentalId?: string,
    type?: 'pre_rental' | 'post_rental' | 'routine',
  ) => void
}

function QueueSection({
  title,
  icon: Icon,
  count,
  children,
  variant = 'default',
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  children: React.ReactNode
  variant?: 'default' | 'warning' | 'destructive'
}) {
  const colorClass =
    variant === 'destructive'
      ? 'text-destructive'
      : variant === 'warning'
        ? 'text-amber-500'
        : 'text-primary'

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${colorClass}`} />
          <h3 className="font-medium">{title}</h3>
        </div>
        <Badge
          variant={variant === 'destructive' ? 'destructive' : 'secondary'}
        >
          {count}
        </Badge>
      </div>
      {children}
    </div>
  )
}

export function InspectionQueue({ onStartInspection }: InspectionQueueProps) {
  const queue = useQuery(api.inspections.getQueue)
  const createFromInspection = useMutation(api.maintenance.createFromInspection)

  if (queue === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  const hasAnyItems =
    queue.preRentalDue.length > 0 ||
    queue.postRentalDue.length > 0 ||
    queue.routineOverdue.length > 0 ||
    queue.flaggedFromInspection.length > 0

  if (!hasAnyItems) {
    return null
  }

  return (
    <div className="space-y-4">
      {queue.preRentalDue.length > 0 && (
        <QueueSection
          title="Pre-Rental Inspections Due"
          icon={Clock}
          count={queue.preRentalDue.length}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Customer</TableHead>
                <TableHead className="font-medium">Start Date</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.preRentalDue.map((item) => (
                <TableRow key={item.rentalId}>
                  <TableCell className="font-medium">
                    {item.equipmentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.customerName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(item.startDate, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() =>
                        onStartInspection(
                          item.equipmentId,
                          item.rentalId,
                          'pre_rental',
                        )
                      }
                    >
                      <ClipboardCheck className="size-4" />
                      Start
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueueSection>
      )}

      {queue.postRentalDue.length > 0 && (
        <QueueSection
          title="Post-Rental Inspections Due"
          icon={ClipboardCheck}
          count={queue.postRentalDue.length}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Customer</TableHead>
                <TableHead className="font-medium">Return Date</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.postRentalDue.map((item) => (
                <TableRow key={item.rentalId}>
                  <TableCell className="font-medium">
                    {item.equipmentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.customerName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(item.returnDate, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() =>
                        onStartInspection(
                          item.equipmentId,
                          item.rentalId,
                          'post_rental',
                        )
                      }
                    >
                      <ClipboardCheck className="size-4" />
                      Start
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueueSection>
      )}

      {queue.routineOverdue.length > 0 && (
        <QueueSection
          title="Routine Inspections Overdue"
          icon={AlertTriangle}
          count={queue.routineOverdue.length}
          variant="warning"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Days Overdue</TableHead>
                <TableHead className="font-medium">Next Service Date</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.routineOverdue.map((item) => (
                <TableRow key={item.equipmentId}>
                  <TableCell className="font-medium">
                    {item.equipmentName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-amber-500 border-amber-500"
                    >
                      {item.daysOverdue} days
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.nextServiceDate
                      ? format(item.nextServiceDate, 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() =>
                        onStartInspection(
                          item.equipmentId,
                          undefined,
                          'routine',
                        )
                      }
                    >
                      <ClipboardCheck className="size-4" />
                      Start
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueueSection>
      )}

      {queue.flaggedFromInspection.length > 0 && (
        <QueueSection
          title="Flagged from Inspections"
          icon={Wrench}
          count={queue.flaggedFromInspection.length}
          variant="warning"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Issue</TableHead>
                <TableHead className="font-medium">Inspection Date</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.flaggedFromInspection.map((item) => (
                <TableRow key={item.inspectionId}>
                  <TableCell className="font-medium">
                    {item.equipmentName}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {item.maintenanceNotes || 'Maintenance required'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(item.inspectedAt, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await createFromInspection({
                          inspectionId: item.inspectionId,
                        })
                      }}
                    >
                      <Wrench className="size-4" />
                      Create Work Order
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueueSection>
      )}
    </div>
  )
}
