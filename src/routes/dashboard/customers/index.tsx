import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Users, MoreHorizontal, Pencil, Plus, Mail, Phone } from 'lucide-react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'

export const Route = createFileRoute('/dashboard/customers/')({
  component: CustomersPage,
})

function CustomerForm({
  initialData,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  initialData?: {
    name: string
    email?: string
    phone?: string
    notes?: string
  }
  onSubmit: (data: {
    name: string
    email?: string
    phone?: string
    notes?: string
  }) => void
  submitLabel: string
  onCancel: () => void
}) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      email: email || undefined,
      phone: phone || undefined,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Customer Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., John Smith"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Phone
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
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

function CustomersPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const customers = useQuery(api.customers.getAll)
  const createCustomer = useMutation(api.customers.create)
  const updateCustomer = useMutation(api.customers.update)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingCustomer, setEditingCustomer] = useState<{
    _id: string
    name: string
    email?: string
    phone?: string
    notes?: string
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
      email?: string
      phone?: string
      notes?: string
    }) => {
      await createCustomer(data)
      setCreateDialogOpen(false)
    },
    [createCustomer],
  )

  const handleEdit = useCallback(
    async (data: {
      name: string
      email?: string
      phone?: string
      notes?: string
    }) => {
      if (!editingCustomer) return
      await updateCustomer({
        id: editingCustomer._id as any,
        ...data,
      })
      setEditDialogOpen(false)
      setEditingCustomer(null)
    },
    [editingCustomer, updateCustomer],
  )

  const toggleSelectAll = useCallback(() => {
    if (customers) {
      const pageIds = customers
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .map((c) => c._id)
      if (
        selectedIds.size === pageIds.length &&
        pageIds.every((id) => selectedIds.has(id))
      ) {
        setSelectedIds(new Set())
      } else {
        setSelectedIds(new Set(pageIds))
      }
    }
  }, [customers, selectedIds, currentPage])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const isLoading = customers === undefined

  const totalPages = customers ? Math.ceil(customers.length / pageSize) : 0
  const paginatedCustomers = customers
    ? customers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
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
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer database and contact information
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            Add Customer
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to your database.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              onSubmit={handleCreate}
              submitLabel="Add Customer"
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </>
      ) : (
        <>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {customers.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total customers in database
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-medium">Customer Directory</h3>
              {selectedIds.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
              )}
            </div>
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="size-12 text-muted-foreground/50" />
                <h4 className="mt-4 font-medium">No customers yet</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first customer to get started
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  Add Customer
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            paginatedCustomers.length > 0 &&
                            paginatedCustomers.every((c) =>
                              selectedIds.has(c._id),
                            )
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="font-medium">Name</TableHead>
                      <TableHead className="font-medium">Email</TableHead>
                      <TableHead className="font-medium">Phone</TableHead>
                      <TableHead className="font-medium text-right">
                        Created
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
                      <TableRow
                        key={customer._id}
                        data-state={selectedIds.has(customer._id) && 'selected'}
                        className="cursor-pointer"
                        onClick={() =>
                          window.location.assign(
                            `/dashboard/customers/${customer._id}`,
                          )
                        }
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(customer._id)}
                            onCheckedChange={() => toggleSelect(customer._id)}
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="size-3.5" />
                              {customer.email}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="size-3.5" />
                              {customer.phone}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(
                            customer.createdAt ?? customer.updatedAt,
                            'MMM d, yyyy',
                          )}
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
                                  setEditingCustomer({
                                    _id: customer._id,
                                    name: customer.name,
                                    email: customer.email,
                                    phone: customer.phone,
                                    notes: customer.notes,
                                  })
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
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

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingCustomer(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update the customer details.</DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              initialData={editingCustomer}
              onSubmit={handleEdit}
              submitLabel="Save Changes"
              onCancel={() => {
                setEditDialogOpen(false)
                setEditingCustomer(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
