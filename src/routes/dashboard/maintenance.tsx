import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState } from 'react'
import { format } from 'date-fns'
import {
  ClipboardCheck,
  Wrench,
  Clock,
  AlertTriangle,
  DollarSign,
  Plus,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { InspectionQueue } from './maintenance/-InspectionQueue'
import { MaintenanceQueue } from './maintenance/-MaintenanceQueue'
import { InspectionForm } from './maintenance/-InspectionForm'
import { MaintenanceForm } from './maintenance/-MaintenanceForm'

export const Route = createFileRoute('/dashboard/maintenance')({
  component: MaintenancePage,
})

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
  good: { label: 'Good', variant: 'default' },
  fair: { label: 'Fair', variant: 'secondary' },
  poor: { label: 'Poor', variant: 'outline' },
  damaged: { label: 'Damaged', variant: 'destructive' },
}

const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
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

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; label: string }
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="size-3 text-primary" />
              <span className="font-medium text-primary">{trend.value}%</span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-primary/5" />
    </div>
  )
}

function MaintenancePage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const inspections = useQuery(api.inspections.getAll)
  const inspectionStats = useQuery(api.inspections.getStats)
  const maintenanceRecords = useQuery(api.maintenance.getAll)
  const maintenanceStats = useQuery(api.maintenance.getStats)

  const [createInspectionOpen, setCreateInspectionOpen] = useState(false)
  const [createMaintenanceOpen, setCreateMaintenanceOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('inspections')

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    )
  }

  const isLoading =
    inspections === undefined ||
    inspectionStats === undefined ||
    maintenanceRecords === undefined ||
    maintenanceStats === undefined

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Manage inspections and maintenance work orders
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={createInspectionOpen}
            onOpenChange={setCreateInspectionOpen}
          >
            <DialogTrigger render={<Button />}>
              <ClipboardCheck className="size-4" />
              New Inspection
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Inspection</DialogTitle>
                <DialogDescription>
                  Create a new equipment inspection record.
                </DialogDescription>
              </DialogHeader>
              <InspectionForm
                onSuccess={() => setCreateInspectionOpen(false)}
                onCancel={() => setCreateInspectionOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={createMaintenanceOpen}
            onOpenChange={setCreateMaintenanceOpen}
          >
            <DialogTrigger render={<Button variant="outline" />}>
              <Wrench className="size-4" />
              New Work Order
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Maintenance Work Order</DialogTitle>
                <DialogDescription>
                  Create a new maintenance work order.
                </DialogDescription>
              </DialogHeader>
              <MaintenanceForm
                onSuccess={() => setCreateMaintenanceOpen(false)}
                onCancel={() => setCreateMaintenanceOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Inspections"
              value={inspectionStats.total}
              subtitle="All time inspections"
              icon={ClipboardCheck}
            />
            <KPICard
              title="Pending Maintenance"
              value={maintenanceStats.pending}
              subtitle="Awaiting work"
              icon={Clock}
            />
            <KPICard
              title="In Progress"
              value={maintenanceStats.inProgress}
              subtitle="Active work orders"
              icon={Wrench}
            />
            <KPICard
              title="Total Cost"
              value={formatCurrency(maintenanceStats.totalCost)}
              subtitle="Maintenance expenses"
              icon={DollarSign}
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="inspections" className="mt-6 space-y-6">
              <InspectionQueue
                onStartInspection={() => {
                  setCreateInspectionOpen(true)
                }}
              />

              <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="font-medium">Inspection History</h3>
                  <span className="text-sm text-muted-foreground">
                    {inspections.length} records
                  </span>
                </div>
                {inspections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ClipboardCheck className="size-12 text-muted-foreground/50" />
                    <h4 className="mt-4 font-medium">No inspections yet</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create your first inspection to get started
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setCreateInspectionOpen(true)}
                    >
                      <Plus className="size-4" />
                      New Inspection
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-medium">Equipment</TableHead>
                        <TableHead className="font-medium">Type</TableHead>
                        <TableHead className="font-medium">Condition</TableHead>
                        <TableHead className="font-medium">Date</TableHead>
                        <TableHead className="font-medium">Damage</TableHead>
                        <TableHead className="font-medium">
                          Maintenance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspections.map((inspection) => (
                        <TableRow
                          key={inspection._id}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-medium">
                            {inspection.equipmentName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {INSPECTION_TYPE_LABELS[inspection.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                CONDITION_CONFIG[inspection.overallCondition]
                                  .variant
                              }
                            >
                              {
                                CONDITION_CONFIG[inspection.overallCondition]
                                  .label
                              }
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(inspection.inspectedAt, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {inspection.damageFound ? (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="size-4 text-destructive" />
                                {inspection.damageCost && (
                                  <span className="text-sm">
                                    {formatCurrency(inspection.damageCost)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                None
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {inspection.maintenanceRequired ? (
                              <div className="flex items-center gap-1">
                                <Wrench className="size-4 text-amber-500" />
                                <span className="text-sm">Required</span>
                              </div>
                            ) : (
                              <CheckCircle className="size-4 text-primary" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6 space-y-6">
              <MaintenanceQueue />

              <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="font-medium">Maintenance History</h3>
                  <span className="text-sm text-muted-foreground">
                    {maintenanceRecords.length} records
                  </span>
                </div>
                {maintenanceRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Wrench className="size-12 text-muted-foreground/50" />
                    <h4 className="mt-4 font-medium">
                      No maintenance records yet
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create your first work order to get started
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setCreateMaintenanceOpen(true)}
                    >
                      <Plus className="size-4" />
                      New Work Order
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-medium">Equipment</TableHead>
                        <TableHead className="font-medium">
                          Work Order
                        </TableHead>
                        <TableHead className="font-medium">Status</TableHead>
                        <TableHead className="font-medium">
                          Assigned To
                        </TableHead>
                        <TableHead className="font-medium text-right">
                          Cost
                        </TableHead>
                        <TableHead className="font-medium">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRecords.map((record) => (
                        <TableRow key={record._id} className="cursor-pointer">
                          <TableCell className="font-medium">
                            {record.equipmentName}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.workOrder}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                MAINTENANCE_STATUS_CONFIG[record.status].variant
                              }
                            >
                              {MAINTENANCE_STATUS_CONFIG[record.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.assignedTo || '-'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {record.cost ? formatCurrency(record.cost) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(record.createdAt, 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
