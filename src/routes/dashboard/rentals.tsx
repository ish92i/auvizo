import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Plus,
  Undo2,
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { RentalForm } from './rentals/-RentalForm'

export const Route = createFileRoute('/dashboard/rentals')({
  component: RentalsPage,
})

type RentalStatus = 'active' | 'returned' | 'overdue'

function getRentalStatus(rental: {
  endDate: number
  returnDate?: number
}): RentalStatus {
  if (rental.returnDate) return 'returned'
  if (Date.now() > rental.endDate) return 'overdue'
  return 'active'
}

const STATUS_CONFIG: Record<
  RentalStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  active: { label: 'Active', variant: 'default' },
  returned: { label: 'Returned', variant: 'secondary' },
  overdue: { label: 'Overdue', variant: 'outline' },
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

function RentalsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const rentals = useQuery(api.rentals.getAll)
  const stats = useQuery(api.rentals.getStats)
  const markReturned = useMutation(api.rentals.markReturned)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [rentalToReturn, setRentalToReturn] = useState<string | null>(null)

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

  const handleReturn = useCallback(
    async (id: string) => {
      await markReturned({ id: id as any })
      setReturnDialogOpen(false)
      setRentalToReturn(null)
    },
    [markReturned],
  )

  const isLoading = rentals === undefined || stats === undefined

  const totalPages = rentals ? Math.ceil(rentals.length / pageSize) : 0
  const paginatedRentals = rentals
    ? rentals.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : []

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => handlePageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>,
      )

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        )
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        )
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rentals</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage equipment rentals
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            New Rental
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Rental</DialogTitle>
              <DialogDescription>
                Create a new equipment rental.
              </DialogDescription>
            </DialogHeader>
            <RentalForm
              onSuccess={() => setCreateDialogOpen(false)}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KPICard
              title="Total Rentals"
              value={stats.total}
              subtitle="All time rentals"
              icon={FileText}
            />
            <KPICard
              title="Active"
              value={stats.active}
              subtitle="Currently on rent"
              icon={Clock}
            />
            <KPICard
              title="Returned"
              value={stats.returned}
              subtitle="Completed rentals"
              icon={CheckCircle}
            />
            <KPICard
              title="Overdue"
              value={stats.overdue}
              subtitle="Past due date"
              icon={AlertTriangle}
            />
            <KPICard
              title="Revenue"
              value={formatCurrency(stats.totalRevenue)}
              subtitle="Total rental revenue"
              icon={DollarSign}
            />
          </div>

          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-medium">Rental History</h3>
            </div>
            {rentals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="size-12 text-muted-foreground/50" />
                <h4 className="mt-4 font-medium">No rentals yet</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first rental to get started
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  New Rental
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-medium">Equipment</TableHead>
                      <TableHead className="font-medium">Customer</TableHead>
                      <TableHead className="font-medium">Start Date</TableHead>
                      <TableHead className="font-medium">End Date</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium text-right">
                        Daily Rate
                      </TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRentals.map((rental) => {
                      const status = getRentalStatus(rental)
                      return (
                        <TableRow
                          key={rental._id}
                          className="cursor-pointer"
                          onClick={() =>
                            window.location.assign(
                              `/dashboard/rentals/${rental._id}`,
                            )
                          }
                        >
                          <TableCell className="font-medium">
                            {rental.equipmentName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {rental.customerName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(rental.startDate, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(rental.endDate, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_CONFIG[status].variant}>
                              {STATUS_CONFIG[status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(rental.dailyRate)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {(status === 'active' || status === 'overdue') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setRentalToReturn(rental._id)
                                  setReturnDialogOpen(true)
                                }}
                              >
                                <Undo2 className="size-4" />
                                Return
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="border-t px-4 py-3">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={
                              currentPage === 1
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                        {renderPaginationItems()}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={
                              currentPage === totalPages
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <AlertDialog
        open={returnDialogOpen}
        onOpenChange={(open) => {
          setReturnDialogOpen(open)
          if (!open) setRentalToReturn(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Returned</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this rental as returned? The
              equipment will be marked as available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rentalToReturn) {
                  handleReturn(rentalToReturn)
                }
              }}
            >
              Mark Returned
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
