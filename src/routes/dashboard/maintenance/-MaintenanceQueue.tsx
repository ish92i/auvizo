import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format } from 'date-fns'
import { Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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

export function MaintenanceQueue() {
  const queue = useQuery(api.maintenance.getQueue)
  const markInProgress = useMutation(api.maintenance.markInProgress)
  const markCompleted = useMutation(api.maintenance.markCompleted)

  if (queue === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  const hasAnyItems =
    queue.flaggedFromInspections.length > 0 ||
    queue.preventiveDue.length > 0 ||
    queue.inProgress.length > 0 ||
    queue.recentlyCompleted.length > 0

  if (!hasAnyItems) {
    return null
  }

  return (
    <div className="space-y-4">
      {queue.flaggedFromInspections.length > 0 && (
        <QueueSection
          title="Flagged from Inspections"
          icon={AlertTriangle}
          count={queue.flaggedFromInspections.length}
          variant="warning"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Work Order</TableHead>
                <TableHead className="font-medium">Created</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.flaggedFromInspections.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {record.equipmentName}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {record.workOrder}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(record.createdAt, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => markInProgress({ id: record._id })}
                    >
                      <Wrench className="size-4" />
                      Start
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueueSection>
      )}

      {queue.preventiveDue.length > 0 && (
        <QueueSection
          title="Preventive Maintenance Due"
          icon={Clock}
          count={queue.preventiveDue.length}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Due</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.preventiveDue.map((item) => (
                <TableRow key={item.equipmentId}>
                  <TableCell className="font-medium">
                    {item.equipmentName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {item.source === 'preventive_time'
                        ? 'Time-based'
                        : 'Hours-based'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.source === 'preventive_time' && item.nextServiceDate
                      ? format(item.nextServiceDate, 'MMM d, yyyy')
                      : item.nextServiceHours
                        ? `${item.currentHours ?? 0}/${item.nextServiceHours} hrs`
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Wrench className="size-4" />
                      Create
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueueSection>
      )}

      {queue.inProgress.length > 0 && (
        <QueueSection
          title="In Progress"
          icon={Wrench}
          count={queue.inProgress.length}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Work Order</TableHead>
                <TableHead className="font-medium">Assigned To</TableHead>
                <TableHead className="font-medium">Started</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.inProgress.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {record.equipmentName}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {record.workOrder}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.assignedTo || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(record.createdAt, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Button size="sm">
                          <CheckCircle className="size-4" />
                          Complete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mark as Completed</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to mark this maintenance work
                            order as completed? The equipment will be marked as
                            available.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => markCompleted({ id: record._id })}
                          >
                            Mark Completed
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueueSection>
      )}

      {queue.recentlyCompleted.length > 0 && (
        <QueueSection
          title="Recently Completed"
          icon={CheckCircle}
          count={queue.recentlyCompleted.length}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Equipment</TableHead>
                <TableHead className="font-medium">Work Order</TableHead>
                <TableHead className="font-medium text-right">Cost</TableHead>
                <TableHead className="font-medium">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.recentlyCompleted.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {record.equipmentName}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {record.workOrder}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {record.cost ? `$${record.cost.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(record.completedAt, 'MMM d, yyyy')}
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
