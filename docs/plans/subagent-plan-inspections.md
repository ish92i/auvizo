# Subagent Plan: Inspections Convex Functions

## Task

Create `convex/inspections.ts` with all CRUD operations and queue queries for the inspections feature.

## Reference Files

- Pattern: `convex/equipment.ts` - follow the same patterns for getAll, getById, create, etc.
- Pattern: `convex/rentals.ts` - follow the same auth/org verification patterns
- Schema: `convex/schema.ts` - inspections table already defined

## Types to Define

```typescript
const inspectionType = v.union(
  v.literal('pre_rental'),
  v.literal('post_rental'),
  v.literal('routine'),
)

const checklistItemStatus = v.union(
  v.literal('ok'),
  v.literal('needs_attention'),
  v.literal('not_applicable'),
)

const overallCondition = v.union(
  v.literal('excellent'),
  v.literal('good'),
  v.literal('fair'),
  v.literal('poor'),
  v.literal('damaged'),
)

const checklistResult = v.object({
  item: v.string(),
  status: checklistItemStatus,
  notes: v.optional(v.string()),
})
```

## Functions to Implement

### 1. `getAll` Query

Returns all inspections for current org with denormalized equipment name.

- Use `by_organization_id` index
- Join with equipment to get equipmentName
- Return in descending order by inspectedAt

### 2. `getById` Query

Returns single inspection with full equipment and inspector details.

- Verify org ownership
- Return null if not found or not authorized

### 3. `getByEquipmentId` Query

Returns all inspections for a specific piece of equipment.

- Use `by_equipment_id` index
- Filter by org
- Return in descending order

### 4. `getByRentalId` Query

Returns inspection linked to a specific rental (for pre/post rental).

- Use `by_rental_id` index
- Filter by org

### 5. `getQueue` Query

Returns inspection queue items grouped by type:

```typescript
returns: v.object({
  preRentalDue: v.array(
    v.object({
      rentalId: v.id('rentals'),
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      customerName: v.string(),
      startDate: v.number(),
    }),
  ),
  postRentalDue: v.array(
    v.object({
      rentalId: v.id('rentals'),
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      customerName: v.string(),
      returnDate: v.number(),
    }),
  ),
  routineOverdue: v.array(
    v.object({
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      nextServiceDate: v.optional(v.number()),
      daysOverdue: v.number(),
    }),
  ),
  flaggedFromInspection: v.array(
    v.object({
      inspectionId: v.id('inspections'),
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      maintenanceNotes: v.optional(v.string()),
      inspectedAt: v.number(),
    }),
  ),
})
```

Logic for queues:

- **preRentalDue**: Rentals with startDate = today, no pre_rental inspection exists
- **postRentalDue**: Rentals with returnDate set, no post_rental inspection exists
- **routineOverdue**: Equipment where nextServiceDate < now, status != 'rented'
- **flaggedFromInspection**: Inspections where maintenanceRequired = true, no pending maintenance record exists

### 6. `getStats` Query

Returns aggregate statistics:

```typescript
returns: v.object({
  total: v.number(),
  preRental: v.number(),
  postRental: v.number(),
  routine: v.number(),
  passedCount: v.number(), // overallCondition in [excellent, good]
  needsMaintenanceCount: v.number(), // maintenanceRequired = true
  damageFoundCount: v.number(),
  totalDamageCost: v.number(),
})
```

### 7. `create` Mutation

Creates a new inspection.

Args:

```typescript
{
  equipmentId: v.id('equipment'),
  type: inspectionType,
  rentalId: v.optional(v.id('rentals')),
  checklistResults: v.array(checklistResult),
  overallCondition: overallCondition,
  damageFound: v.boolean(),
  damageDescription: v.optional(v.string()),
  damageCost: v.optional(v.number()),
  maintenanceRequired: v.boolean(),
  maintenanceNotes: v.optional(v.string()),
  photos: v.optional(v.array(v.id('_storage'))),
}
```

Logic:

1. Verify auth and org
2. Get current user via `users.current` pattern (get by clerkId)
3. Insert inspection with inspectorId = current user \_id
4. If maintenanceRequired = true, optionally create a pending maintenance record (or leave for UI to trigger)

### 8. `generateUploadUrl` Mutation

Returns a URL for uploading photos to Convex file storage.

```typescript
handler: async (ctx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')
  return await ctx.storage.generateUploadUrl()
}
```

## Standard Checklist Items

Export a constant for the default checklist:

```typescript
export const DEFAULT_CHECKLIST_ITEMS = [
  'Tires/Tracks',
  'Hydraulics',
  'Engine/Power',
  'Body/Frame',
  'Safety Features',
  'Fluids',
  'Controls',
  'Attachments',
]
```

## Auth Pattern (use in all functions)

```typescript
const identity = await ctx.auth.getUserIdentity()
if (!identity?.orgId) {
  return [] // or throw for mutations
}

const org = await ctx.db
  .query('organizations')
  .withIndex('by_clerk_org_id', (q) =>
    q.eq('clerkOrgId', identity.orgId as string),
  )
  .unique()

if (!org) {
  return [] // or throw
}
```

## Output File

`convex/inspections.ts`
