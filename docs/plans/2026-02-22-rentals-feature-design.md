# Rentals Feature Design

**Date:** 2026-02-22  
**Status:** Approved

## Overview

Implement a complete Rentals system tightly coupled with the Equipments system. Equipment status is automatically synchronized with rental activity through backend mutations.

## Design Decisions

| Decision           | Choice              | Rationale                                                         |
| ------------------ | ------------------- | ----------------------------------------------------------------- |
| Rental status      | Inferred from dates | No explicit status field; derived from `returnDate` and `endDate` |
| Equipment conflict | Block with error    | Cannot rent equipment with status `rented` or `maintenance`       |
| KPI metrics        | Standard            | Total, Active, Returned, Overdue, Revenue                         |
| Architecture       | Single mutations    | Rental mutations contain inline equipment status updates          |

---

## Backend (`convex/rentals.ts`)

### Queries

#### `getAll`

Fetch all rentals for the current organization with equipment and customer names populated.

```typescript
returns: v.array(
  v.object({
    _id: v.id('rentals'),
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
  }),
)
```

#### `getById`

Fetch a single rental with full equipment and customer details.

```typescript
args: {
  id: v.id('rentals')
}
returns: v.union(rentalWithDetails, v.null())
```

#### `getStats`

Return aggregated metrics for the KPI section.

```typescript
returns: v.object({
  total: v.number(),
  active: v.number(),
  returned: v.number(),
  overdue: v.number(),
  totalRevenue: v.number(),
})
```

Revenue calculation: Sum of `(returnDate - startDate) * dailyRate` for returned rentals.

### Mutations

#### `create`

Create a new rental and update equipment status.

```typescript
args: {
  equipmentId: v.id('equipment'),
  customerId: v.id('customers'),
  startDate: v.number(),
  endDate: v.number(),
  dailyRate: v.number(),
  notes: v.optional(v.string()),
}
returns: v.id('rentals')
```

Logic:

1. Validate user is authenticated with organization
2. Fetch equipment, verify it exists and belongs to org
3. If equipment status is not `available`, throw error: "Equipment is not available for rent"
4. Create rental record
5. Update equipment status to `rented`

#### `markReturned`

Mark a rental as returned and free up equipment.

```typescript
args: {
  id: v.id('rentals'),
  returnDate: v.optional(v.number()), // defaults to Date.now()
}
returns: v.null()
```

Logic:

1. Validate rental exists and belongs to org
2. If rental already has `returnDate`, throw error: "Rental already marked as returned"
3. Set `returnDate` (use provided or `Date.now()`)
4. Update equipment status to `available`

#### `update`

Update rental details (excluding equipment, customer, startDate, returnDate).

```typescript
args: {
  id: v.id('rentals'),
  endDate: v.optional(v.number()),
  dailyRate: v.optional(v.number()),
  notes: v.optional(v.string()),
}
returns: v.null()
```

### Status Derivation

```typescript
type RentalStatus = 'active' | 'returned' | 'overdue'

function getRentalStatus(rental: {
  endDate: number
  returnDate?: number
}): RentalStatus {
  if (rental.returnDate) return 'returned'
  if (Date.now() > rental.endDate) return 'overdue'
  return 'active'
}
```

---

## Frontend Routes

### `/dashboard/rentals` — List Page

**KPI Section:**

- Total Rentals
- Active Rentals
- Returned Rentals
- Overdue Rentals
- Total Revenue

**Table Columns:**
| Column | Content |
|--------|---------|
| Equipment | Equipment name (link to details) |
| Customer | Customer name |
| Start Date | Formatted date |
| End Date | Formatted date |
| Status | Badge (active/returned/overdue) |
| Daily Rate | Currency formatted |
| Actions | Mark Returned button (for active only) |

**Row Behavior:** Click anywhere → `/dashboard/rentals/{id}`

**Create Button:** Opens dialog with rental creation form

### `/dashboard/rentals/$id` — Details Page

**Header:**

- Equipment name + category badge
- Customer name
- Status badge

**Details Sections:**

- Rental Info: Start date, end date, return date (if returned), daily rate
- Financial: Total cost (calculated based on return or current date)
- Notes

**Actions:**

- "Mark as Returned" button (visible only for active rentals)
- Link to equipment details
- Link to customer (future)

### Creation Dialog

**Fields:**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Equipment | Select (filtered) | — | Only shows `available` equipment |
| Customer | Select + Create | — | Dropdown with "Add Customer" option |
| Start Date | Date picker | Today | Editable |
| End Date | Date picker | — | Required |
| Daily Rate | Number input | — | Required |
| Notes | Textarea | — | Optional |

**Customer Quick-Create:**
When "Add Customer" is selected in the customer dropdown:

1. Show inline form: name, email, phone, notes
2. On submit, create customer via mutation
3. Auto-select the newly created customer

---

## Customer Backend (`convex/customers.ts`)

Required mutations:

```typescript
// Create a new customer
create: mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id('customers'),
})

// Get all customers for organization
getAll: query({
  args: {},
  returns: v.array(customerDoc),
})
```

---

## Schema

No changes required. Existing schema supports all features:

```typescript
rentals: defineTable({
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
  .index('by_organization_id', ['organizationId'])
  .index('by_equipment_id', ['equipmentId'])
  .index('by_customer_id', ['customerId'])
```

---

## Error Handling

| Scenario                         | Error Message                                                   |
| -------------------------------- | --------------------------------------------------------------- |
| Rent unavailable equipment       | "Equipment is not available for rent. Current status: [status]" |
| Return already returned rental   | "This rental has already been marked as returned"               |
| Create rental without org        | "No organization selected. Please select an organization."      |
| Access rental from different org | "Rental not found"                                              |

---

## Data Integrity

1. **Equipment-Rental Sync:** All status changes happen in mutations
2. **Organization Isolation:** All queries filter by organization
3. **Atomic Operations:** Create rental + update equipment happen in single mutation
4. **No Ghost Rentals:** Cannot rent equipment already rented
