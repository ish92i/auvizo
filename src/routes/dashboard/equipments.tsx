import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Package,
  CheckCircle,
  Clock,
  Wrench,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/dashboard/equipments')({
  component: EquipmentsPage,
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
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  available: { label: 'Available', variant: 'default' },
  rented: { label: 'Rented', variant: 'secondary' },
  maintenance: { label: 'Maintenance', variant: 'outline' },
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

function EquipmentForm({
  initialData,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  initialData?: {
    name: string
    category: EquipmentCategory
    status: EquipmentStatus
    assetValue: number
    notes?: string
    totalHoursUsed?: number
  }
  onSubmit: (data: {
    name: string
    category: EquipmentCategory
    status: EquipmentStatus
    assetValue: number
    notes?: string
    totalHoursUsed?: number
  }) => void
  submitLabel: string
  onCancel: () => void
}) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [category, setCategory] = useState<EquipmentCategory>(
    initialData?.category ?? 'earthmoving',
  )
  const [status, setStatus] = useState<EquipmentStatus>(
    initialData?.status ?? 'available',
  )
  const [assetValue, setAssetValue] = useState(
    initialData?.assetValue.toString() ?? '',
  )
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [totalHoursUsed, setTotalHoursUsed] = useState(
    initialData?.totalHoursUsed?.toString() ?? '',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      category,
      status,
      assetValue: parseFloat(assetValue) || 0,
      notes: notes || undefined,
      totalHoursUsed: parseFloat(totalHoursUsed) || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Equipment Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., CAT 320 Excavator"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Category
          </label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as EquipmentCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as EquipmentStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Asset Value ($)
          </label>
          <Input
            type="number"
            value={assetValue}
            onChange={(e) => setAssetValue(e.target.value)}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Hours Used
          </label>
          <Input
            type="number"
            value={totalHoursUsed}
            onChange={(e) => setTotalHoursUsed(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Notes
        </label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  )
}

function EquipmentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const equipments = useQuery(api.equipment.getAll)
  const stats = useQuery(api.equipment.getStats)
  const createEquipment = useMutation(api.equipment.create)
  const updateEquipment = useMutation(api.equipment.update)
  const updateStatus = useMutation(api.equipment.updateStatus)
  const removeEquipment = useMutation(api.equipment.remove)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<{
    _id: string
    name: string
    category: EquipmentCategory
    status: EquipmentStatus
    assetValue: number
    notes?: string
    totalHoursUsed?: number
  } | null>(null)

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

  const handleCreate = useCallback(
    async (data: {
      name: string
      category: EquipmentCategory
      status: EquipmentStatus
      assetValue: number
      notes?: string
      totalHoursUsed?: number
    }) => {
      await createEquipment(data)
      setCreateDialogOpen(false)
    },
    [createEquipment],
  )

  const handleEdit = useCallback(
    async (data: {
      name: string
      category: EquipmentCategory
      status: EquipmentStatus
      assetValue: number
      notes?: string
      totalHoursUsed?: number
    }) => {
      if (!editingEquipment) return
      await updateEquipment({
        id: editingEquipment._id as any,
        ...data,
      })
      setEditDialogOpen(false)
      setEditingEquipment(null)
    },
    [editingEquipment, updateEquipment],
  )

  const handleStatusChange = useCallback(
    async (id: string, newStatus: EquipmentStatus) => {
      await updateStatus({ id: id as any, status: newStatus })
    },
    [updateStatus],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await removeEquipment({ id: id as any })
    },
    [removeEquipment],
  )

  const isLoading = equipments === undefined || stats === undefined

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipments</h1>
          <p className="text-sm text-muted-foreground">
            Manage your fleet inventory and track equipment status
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            Add Equipment
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
              <DialogDescription>
                Add a new piece of equipment to your fleet.
              </DialogDescription>
            </DialogHeader>
            <EquipmentForm
              onSubmit={handleCreate}
              submitLabel="Add Equipment"
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
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
              title="Total Fleet"
              value={stats.total}
              subtitle={`${stats.total} units in inventory`}
              icon={Package}
            />
            <KPICard
              title="Available"
              value={stats.available}
              subtitle="Ready to rent"
              icon={CheckCircle}
            />
            <KPICard
              title="Rented Out"
              value={stats.rented}
              subtitle="Currently on rent"
              icon={Clock}
            />
            <KPICard
              title="Total Value"
              value={formatCurrency(stats.totalAssetValue)}
              subtitle="Combined asset value"
              icon={DollarSign}
              trend={
                stats.total > 0
                  ? {
                      value: Math.round(stats.utilizationRate),
                      label: 'utilization',
                    }
                  : undefined
              }
            />
          </div>

          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">Equipment Inventory</h3>
            </div>
            {equipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="size-12 text-muted-foreground/50" />
                <h4 className="mt-4 font-medium">No equipment yet</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first piece of equipment to get started
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  Add Equipment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Category</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium text-right">
                      Asset Value
                    </TableHead>
                    <TableHead className="font-medium text-right">
                      Hours
                    </TableHead>
                    <TableHead className="font-medium text-right">
                      Updated
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipments.map((equipment) => (
                    <TableRow
                      key={equipment._id}
                      className="cursor-pointer"
                      onClick={() =>
                        window.location.assign(
                          `/dashboard/equipment/${equipment._id}`,
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {equipment.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {CATEGORY_LABELS[equipment.category]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_CONFIG[equipment.status].variant}
                        >
                          {STATUS_CONFIG[equipment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(equipment.assetValue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {equipment.totalHoursUsed?.toLocaleString() ?? '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {format(equipment.updatedAt, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8"
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingEquipment({
                                  _id: equipment._id,
                                  name: equipment.name,
                                  category: equipment.category,
                                  status: equipment.status,
                                  assetValue: equipment.assetValue,
                                  notes: equipment.notes,
                                  totalHoursUsed: equipment.totalHoursUsed,
                                })
                                setEditDialogOpen(true)
                              }}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(equipment._id, 'available')
                              }
                              disabled={equipment.status === 'available'}
                            >
                              <CheckCircle className="size-4" />
                              Set Available
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(equipment._id, 'rented')
                              }
                              disabled={equipment.status === 'rented'}
                            >
                              <Clock className="size-4" />
                              Set Rented
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(equipment._id, 'maintenance')
                              }
                              disabled={equipment.status === 'maintenance'}
                            >
                              <Wrench className="size-4" />
                              Set Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <DropdownMenuItem variant="destructive" />
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Equipment
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {equipment.name}"? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(equipment._id)}
                                    className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingEquipment(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update the equipment details.</DialogDescription>
          </DialogHeader>
          {editingEquipment && (
            <EquipmentForm
              initialData={editingEquipment}
              onSubmit={handleEdit}
              submitLabel="Save Changes"
              onCancel={() => {
                setEditDialogOpen(false)
                setEditingEquipment(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
