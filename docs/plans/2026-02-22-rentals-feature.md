# Rentals Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Rentals system with backend mutations that automatically sync equipment status, and frontend pages for listing, viewing, and creating rentals.

**Architecture:** Single mutations in `convex/rentals.ts` contain inline equipment status updates. Status inferred from dates (not explicit field). Frontend follows existing Equipments page pattern with KPI cards, table, and details page.

**Tech Stack:** Convex (backend), TanStack Router (routing), React, shadcn/ui components

---

## Task 1: Create Customer Backend Functions

**Files:**

- Create: `convex/customers.ts`

**Step 1: Create customers.ts with getAll and create mutations**

```typescript
import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const customerDoc = v.object({
  _id: v.id('customers'),
  _creationTime: v.number(),
  organizationId: v.id('organizations'),
  name: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const getAll = query({
  args: {},
  returns: v.array(customerDoc),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return []
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      return []
    }

    return await ctx.db
      .query('customers')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('customers') },
  returns: v.union(customerDoc, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return null
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      return null
    }

    const customer = await ctx.db.get(args.id)
    if (!customer || customer.organizationId !== org._id) {
      return null
    }

    return customer
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id('customers'),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      throw new Error('Not authenticated')
    }

    if (!identity.orgId) {
      throw new Error(
        'No organization selected. Please select an organization in the sidebar.',
      )
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      throw new Error('Organization not found')
    }

    const now = Date.now()
    return await ctx.db.insert('customers', {
      organizationId: org._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    })
  },
})
```

**Step 2: Commit**

```bash
git add convex/customers.ts
git commit -m "feat(customers): add getAll, getById, and create functions"
```

---

## Task 2: Create Rental Backend Functions

**Files:**

- Create: `convex/rentals.ts`

**Step 1: Create rentals.ts with queries and mutations**

```typescript
import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const rentalStatus = v.union(
  v.literal('active'),
  v.literal('returned'),
  v.literal('overdue'),
)

const rentalDoc = v.object({
  _id: v.id('rentals'),
  _creationTime: v.number(),
  organizationId: v.id('organizations'),
  equipmentId: v.id('equipment'),
  customerId: v.id('customers'),
  startDate: v.number(),
  endDate: v.number(),
  returnDate: v.optional(v.number()),
  dailyRate: v.number(),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const rentalWithDetails = v.object({
  _id: v.id('rentals'),
  _creationTime: v.number(),
  organizationId: v.id('organizations'),
  equipmentId: v.id('equipment'),
  equipmentName: v.string(),
  customerId: v.id('customers'),
  customerName: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  returnDate: v.optional(v.number()),
  dailyRate: v.number(),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

function getRentalStatus(
  rental: { endDate: number; returnDate?: number },
  now: number = Date.now(),
): 'active' | 'returned' | 'overdue' {
  if (rental.returnDate) return 'returned'
  if (now > rental.endDate) return 'overdue'
  return 'active'
}

export const getAll = query({
  args: {},
  returns: v.array(rentalWithDetails),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return []
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      return []
    }

    const rentals = await ctx.db
      .query('rentals')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .order('desc')
      .collect()

    const results = await Promise.all(
      rentals.map(async (rental) => {
        const equipment = await ctx.db.get(rental.equipmentId)
        const customer = await ctx.db.get(rental.customerId)
        return {
          ...rental,
          equipmentName: equipment?.name ?? 'Unknown Equipment',
          customerName: customer?.name ?? 'Unknown Customer',
        }
      }),
    )

    return results
  },
})

export const getById = query({
  args: { id: v.id('rentals') },
  returns: v.union(
    v.object({
      _id: v.id('rentals'),
      _creationTime: v.number(),
      organizationId: v.id('organizations'),
      equipmentId: v.id('equipment'),
      equipment: v.union(
        v.object({
          _id: v.id('equipment'),
          _creationTime: v.number(),
          organizationId: v.id('organizations'),
          name: v.string(),
          category: v.union(
            v.literal('earthmoving'),
            v.literal('mewp'),
            v.literal('material_handling'),
            v.literal('power_generation'),
            v.literal('air_compressors'),
            v.literal('lawn_garden'),
            v.literal('compaction_paving'),
            v.literal('concrete_masonry'),
            v.literal('lighting'),
            v.literal('trucks_transportation'),
          ),
          status: v.union(
            v.literal('available'),
            v.literal('rented'),
            v.literal('maintenance'),
          ),
          assetValue: v.number(),
          notes: v.optional(v.string()),
          totalHoursUsed: v.optional(v.number()),
          createdAt: v.number(),
          updatedAt: v.number(),
        }),
        v.null(),
      ),
      customerId: v.id('customers'),
      customer: v.union(
        v.object({
          _id: v.id('customers'),
          _creationTime: v.number(),
          organizationId: v.id('organizations'),
          name: v.string(),
          email: v.optional(v.string()),
          phone: v.optional(v.string()),
          notes: v.optional(v.string()),
          createdAt: v.number(),
          updatedAt: v.number(),
        }),
        v.null(),
      ),
      startDate: v.number(),
      endDate: v.number(),
      returnDate: v.optional(v.number()),
      dailyRate: v.number(),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return null
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      return null
    }

    const rental = await ctx.db.get(args.id)
    if (!rental || rental.organizationId !== org._id) {
      return null
    }

    const equipment = await ctx.db.get(rental.equipmentId)
    const customer = await ctx.db.get(rental.customerId)

    return {
      ...rental,
      equipment,
      customer,
    }
  },
})

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    active: v.number(),
    returned: v.number(),
    overdue: v.number(),
    totalRevenue: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return {
        total: 0,
        active: 0,
        returned: 0,
        overdue: 0,
        totalRevenue: 0,
      }
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      return {
        total: 0,
        active: 0,
        returned: 0,
        overdue: 0,
        totalRevenue: 0,
      }
    }

    const rentals = await ctx.db
      .query('rentals')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const now = Date.now()
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    let active = 0
    let returned = 0
    let overdue = 0
    let totalRevenue = 0

    for (const rental of rentals) {
      const status = getRentalStatus(rental, now)
      if (status === 'active') active++
      else if (status === 'returned') returned++
      else if (status === 'overdue') overdue++

      if (rental.returnDate) {
        const days = Math.max(
          1,
          Math.ceil((rental.returnDate - rental.startDate) / MS_PER_DAY),
        )
        totalRevenue += days * rental.dailyRate
      }
    }

    return {
      total: rentals.length,
      active,
      returned,
      overdue,
      totalRevenue,
    }
  },
})

export const create = mutation({
  args: {
    equipmentId: v.id('equipment'),
    customerId: v.id('customers'),
    startDate: v.number(),
    endDate: v.number(),
    dailyRate: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id('rentals'),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      throw new Error('Not authenticated')
    }

    if (!identity.orgId) {
      throw new Error(
        'No organization selected. Please select an organization in the sidebar.',
      )
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      throw new Error('Organization not found')
    }

    const equipment = await ctx.db.get(args.equipmentId)
    if (!equipment || equipment.organizationId !== org._id) {
      throw new Error('Equipment not found')
    }

    if (equipment.status !== 'available') {
      throw new Error(
        `Equipment is not available for rent. Current status: ${equipment.status}`,
      )
    }

    const now = Date.now()
    const rentalId = await ctx.db.insert('rentals', {
      organizationId: org._id,
      equipmentId: args.equipmentId,
      customerId: args.customerId,
      startDate: args.startDate,
      endDate: args.endDate,
      dailyRate: args.dailyRate,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(args.equipmentId, {
      status: 'rented',
      updatedAt: now,
    })

    return rentalId
  },
})

export const markReturned = mutation({
  args: {
    id: v.id('rentals'),
    returnDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      throw new Error('Not authenticated')
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      throw new Error('Organization not found')
    }

    const rental = await ctx.db.get(args.id)
    if (!rental || rental.organizationId !== org._id) {
      throw new Error('Rental not found')
    }

    if (rental.returnDate) {
      throw new Error('This rental has already been marked as returned')
    }

    const now = Date.now()
    await ctx.db.patch(args.id, {
      returnDate: args.returnDate ?? now,
      updatedAt: now,
    })

    await ctx.db.patch(rental.equipmentId, {
      status: 'available',
      updatedAt: now,
    })

    return null
  },
})

export const update = mutation({
  args: {
    id: v.id('rentals'),
    endDate: v.optional(v.number()),
    dailyRate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      throw new Error('Not authenticated')
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      throw new Error('Organization not found')
    }

    const rental = await ctx.db.get(args.id)
    if (!rental || rental.organizationId !== org._id) {
      throw new Error('Rental not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    if (args.endDate !== undefined) updates.endDate = args.endDate
    if (args.dailyRate !== undefined) updates.dailyRate = args.dailyRate
    if (args.notes !== undefined) updates.notes = args.notes

    await ctx.db.patch(args.id, updates)
    return null
  },
})
```

**Step 2: Commit**

```bash
git add convex/rentals.ts
git commit -m "feat(rentals): add queries and mutations for rentals CRUD"
```

---

## Task 3: Add Available Equipment Query

**Files:**

- Modify: `convex/equipment.ts`

**Step 1: Add getAvailable query to equipment.ts**

Add after `getStats` function (around line 158):

```typescript
export const getAvailable = query({
  args: {},
  returns: v.array(equipmentDoc),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return []
    }

    const org = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_org_id', (q) =>
        q.eq('clerkOrgId', identity.orgId as string),
      )
      .unique()

    if (!org) {
      return []
    }

    return await ctx.db
      .query('equipment')
      .withIndex('by_organization_id_and_status', (q) =>
        q.eq('organizationId', org._id).eq('status', 'available'),
      )
      .collect()
  },
})
```

**Step 2: Commit**

```bash
git add convex/equipment.ts
git commit -m "feat(equipment): add getAvailable query for rental selection"
```

---

## Task 4: Create Rentals List Page

**Files:**

- Create: `src/routes/dashboard/rentals.tsx`

**Step 1: Create the rentals list page**

```typescript
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
  Calendar,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { RentalForm } from './rentals/RentalForm'

export const Route = createFileRoute('/dashboard/rentals')({
  component: RentalsPage,
})

type RentalStatus = 'active' | 'returned' | 'overdue'

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

function getRentalStatus(
  rental: { endDate: number; returnDate?: number },
): RentalStatus {
  if (rental.returnDate) return 'returned'
  if (Date.now() > rental.endDate) return 'overdue'
  return 'active'
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

  const handleMarkReturned = useCallback(
    async (rentalId: string) => {
      await markReturned({ id: rentalId as any })
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
            Track equipment rentals and manage returns
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            New Rental
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Rental</DialogTitle>
              <DialogDescription>
                Rent out equipment to a customer.
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
              subtitle={`${stats.total} rentals`}
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
              subtitle="From returned rentals"
              icon={DollarSign}
            />
          </div>

          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-medium">All Rentals</h3>
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
                      <TableHead className="font-medium text-right">
                        Actions
                      </TableHead>
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
                            {status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkReturned(rental._id)}
                              >
                                <CheckCircle className="size-4" />
                                Return
                              </Button>
                            )}
                            {status === 'overdue' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkReturned(rental._id)}
                              >
                                <CheckCircle className="size-4" />
                                Return
                              </Button>
                            )}
                            {status === 'returned' && (
                              <span className="text-xs text-muted-foreground">
                                {rental.returnDate
                                  ? format(rental.returnDate, 'MMM d, yyyy')
                                  : '-'}
                              </span>
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
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/routes/dashboard/rentals.tsx
git commit -m "feat(rentals): add rentals list page with KPIs and table"
```

---

## Task 5: Create Rental Form Component

**Files:**

- Create: `src/routes/dashboard/rentals/RentalForm.tsx`

**Step 1: Create the rental form directory and component**

```bash
mkdir -p src/routes/dashboard/rentals
```

```typescript
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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

function formatDateForInput(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd')
}

function parseDateFromInput(dateString: string): number {
  return new Date(dateString).getTime()
}

export function RentalForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const availableEquipment = useQuery(api.equipment.getAvailable)
  const customers = useQuery(api.customers.getAll)
  const createRental = useMutation(api.rentals.create)
  const createCustomer = useMutation(api.customers.create)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  const [equipmentId, setEquipmentId] = useState<string>('')
  const [customerId, setCustomerId] = useState<string>('')
  const [startDate, setStartDate] = useState(formatDateForInput(todayTimestamp))
  const [endDate, setEndDate] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerNotes, setNewCustomerNotes] = useState('')
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomerName.trim()) return

    setIsCreatingCustomer(true)
    try {
      const id = await createCustomer({
        name: newCustomerName,
        email: newCustomerEmail || undefined,
        phone: newCustomerPhone || undefined,
        notes: newCustomerNotes || undefined,
      })
      setCustomerId(id)
      setShowNewCustomer(false)
      setNewCustomerName('')
      setNewCustomerEmail('')
      setNewCustomerPhone('')
      setNewCustomerNotes('')
    } catch (error) {
      console.error('Failed to create customer:', error)
    } finally {
      setIsCreatingCustomer(false)
    }
  }, [
    createCustomer,
    newCustomerName,
    newCustomerEmail,
    newCustomerPhone,
    newCustomerNotes,
  ])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!equipmentId || !customerId || !startDate || !endDate || !dailyRate) {
        return
      }

      setIsSubmitting(true)
      try {
        await createRental({
          equipmentId: equipmentId as any,
          customerId: customerId as any,
          startDate: parseDateFromInput(startDate),
          endDate: parseDateFromInput(endDate),
          dailyRate: parseFloat(dailyRate),
          notes: notes || undefined,
        })
        onSuccess()
      } catch (error) {
        console.error('Failed to create rental:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [createRental, equipmentId, customerId, startDate, endDate, dailyRate, notes, onSuccess],
  )

  if (availableEquipment === undefined || customers === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Equipment
        </label>
        <Select value={equipmentId} onValueChange={setEquipmentId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select equipment" />
          </SelectTrigger>
          <SelectContent>
            {availableEquipment.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No available equipment
              </div>
            ) : (
              availableEquipment.map((eq) => (
                <SelectItem key={eq._id} value={eq._id}>
                  <span className="font-medium">{eq.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({CATEGORY_LABELS[eq.category]})
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Customer
        </label>
        <div className="flex gap-2">
          <Select
            value={showNewCustomer ? 'new' : customerId}
            onValueChange={(v) => {
              if (v === 'new') {
                setShowNewCustomer(true)
              } else {
                setShowNewCustomer(false)
                setCustomerId(v)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">
                <Plus className="size-4" />
                Add New Customer
              </SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer._id} value={customer._id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showNewCustomer && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="text-sm font-medium">New Customer</div>
          <div className="space-y-2">
            <Input
              placeholder="Customer name *"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
            </div>
            <Input
              placeholder="Notes"
              value={newCustomerNotes}
              onChange={(e) => setNewCustomerNotes(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCustomer}
              disabled={!newCustomerName.trim() || isCreatingCustomer}
            >
              {isCreatingCustomer ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Create & Select'
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Daily Rate ($)
        </label>
        <Input
          type="number"
          value={dailyRate}
          onChange={(e) => setDailyRate(e.target.value)}
          placeholder="0"
          min="0"
          step="0.01"
          required
        />
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

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !equipmentId ||
            !customerId ||
            !startDate ||
            !endDate ||
            !dailyRate
          }
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Create Rental'
          )}
        </Button>
      </div>
    </form>
  )
}
```

**Step 2: Commit**

```bash
git add src/routes/dashboard/rentals/RentalForm.tsx
git commit -m "feat(rentals): add rental creation form with customer quick-create"
```

---

## Task 6: Create Rental Details Page

**Files:**

- Create: `src/routes/dashboard/rentals/$id.tsx`

**Step 1: Create the rental details page**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format } from 'date-fns'
import {
  FileText,
  Calendar,
  Clock,
  DollarSign,
  ArrowLeft,
  User,
  Package,
  CheckCircle,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

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
  { label: string; variant: 'default' | 'secondary' | 'outline'; color: string }
> = {
  active: {
    label: 'Active',
    variant: 'default',
    color: 'text-primary',
  },
  returned: {
    label: 'Returned',
    variant: 'secondary',
    color: 'text-muted-foreground',
  },
  overdue: {
    label: 'Overdue',
    variant: 'outline',
    color: 'text-destructive',
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

function getRentalStatus(
  rental: { endDate: number; returnDate?: number },
): RentalStatus {
  if (rental.returnDate) return 'returned'
  if (Date.now() > rental.endDate) return 'overdue'
  return 'active'
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

function RentalDetailsPage() {
  const { id } = Route.useParams()
  const rental = useQuery(api.rentals.getById, { id: id as any })
  const markReturned = useMutation(api.rentals.markReturned)

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
        <FileText className="size-16 text-muted-foreground/50" />
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

  const handleMarkReturned = async () => {
    await markReturned({ id: rental._id })
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const rentalDays = Math.ceil(
    ((rental.returnDate ?? Date.now()) - rental.startDate) / MS_PER_DAY,
  )
  const totalCost = Math.max(1, rentalDays) * rental.dailyRate

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="size-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {rental.equipment?.name ?? 'Unknown Equipment'}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={STATUS_CONFIG[status].variant}>
                {STATUS_CONFIG[status].label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Rental #{rental._id.slice(-6)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status !== 'returned' && (
            <Button onClick={handleMarkReturned}>
              <CheckCircle className="size-4" />
              Mark as Returned
            </Button>
          )}
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Rental Details">
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
            value={`${Math.max(1, rentalDays)} day(s)`}
          />
        </DetailSection>

        <DetailSection title="Financial">
          <DetailRow
            icon={DollarSign}
            label="Daily Rate"
            value={formatCurrency(rental.dailyRate)}
          />
          <DetailRow
            icon={DollarSign}
            label="Total Cost"
            value={<span className="text-lg">{formatCurrency(totalCost)}</span>}
          />
        </DetailSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Equipment">
          {rental.equipment ? (
            <>
              <DetailRow
                icon={Package}
                label="Name"
                value={
                  <a
                    href={`/dashboard/equipment/${rental.equipment._id}`}
                    className="text-primary hover:underline"
                  >
                    {rental.equipment.name}
                  </a>
                }
              />
              <DetailRow
                label="Category"
                value={CATEGORY_LABELS[rental.equipment.category]}
              />
              <DetailRow
                label="Status"
                value={
                  <span
                    className={
                      rental.equipment.status === 'available'
                        ? 'text-primary'
                        : rental.equipment.status === 'rented'
                          ? 'text-blue-500'
                          : 'text-amber-500'
                    }
                  >
                    {rental.equipment.status.charAt(0).toUpperCase() +
                      rental.equipment.status.slice(1)}
                  </span>
                }
              />
            </>
          ) : (
            <div className="px-4 py-3 text-muted-foreground">
              Equipment not found
            </div>
          )}
        </DetailSection>

        <DetailSection title="Customer">
          {rental.customer ? (
            <>
              <DetailRow
                icon={User}
                label="Name"
                value={rental.customer.name}
              />
              {rental.customer.email && (
                <DetailRow label="Email" value={rental.customer.email} />
              )}
              {rental.customer.phone && (
                <DetailRow label="Phone" value={rental.customer.phone} />
              )}
            </>
          ) : (
            <div className="px-4 py-3 text-muted-foreground">
              Customer not found
            </div>
          )}
        </DetailSection>
      </div>

      <DetailSection title="Notes">
        {rental.notes ? (
          <div className="px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {rental.notes}
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 text-center text-sm text-muted-foreground">
            No notes for this rental
          </div>
        )}
      </DetailSection>

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
```

**Step 2: Commit**

```bash
git add src/routes/dashboard/rentals/\$id.tsx
git commit -m "feat(rentals): add rental details page with return action"
```

---

## Task 7: Update Sidebar Navigation

**Files:**

- Modify: `src/components/dashboard/app-sidebar.tsx`

**Step 1: Add Rentals link to sidebar navigation**

Find the navigation items array and add a Rentals entry alongside Equipments:

Look for the nav items definition (likely around line 20-50) and add:

```typescript
{
  title: 'Rentals',
  url: '/dashboard/rentals',
  icon: FileText,
}
```

Note: You'll need to import `FileText` from lucide-react if not already imported.

**Step 2: Commit**

```bash
git add src/components/dashboard/app-sidebar.tsx
git commit -m "feat(sidebar): add Rentals navigation link"
```

---

## Task 8: Verify and Test

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 2: Run linting**

```bash
npm run lint
```

**Step 3: Manual testing checklist**

1. Navigate to `/dashboard/rentals` - verify page loads
2. Click "New Rental" - verify form opens
3. Create a new customer inline - verify customer is created and selected
4. Create a rental - verify equipment status changes to "rented"
5. Click on a rental row - verify details page loads
6. Click "Mark as Returned" - verify equipment status changes to "available"
7. Verify KPIs update correctly
8. Check that unavailable equipment is not shown in the equipment selector

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(rentals): complete rentals feature with equipment sync"
```
