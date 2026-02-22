# Subagent Plan: Equipment Updates for Maintenance

## Task

Update `convex/equipment.ts` to add new queries and update functions for maintenance scheduling.

## Reference Files

- Current: `convex/equipment.ts`
- Schema updates in `convex/schema.ts` - new fields already added:
  - lastServiceDate
  - lastServiceHours
  - nextServiceDate
  - nextServiceHours
  - serviceIntervalDays
  - serviceIntervalHours

## Changes to Make

### 1. Update `equipmentDoc` Type

Add the new fields to the return type validator:

```typescript
const equipmentDoc = v.object({
  _id: v.id('equipment'),
  _creationTime: v.number(),
  organizationId: v.id('organizations'),
  name: v.string(),
  category: equipmentCategory,
  status: equipmentStatus,
  assetValue: v.number(),
  notes: v.optional(v.string()),
  totalHoursUsed: v.optional(v.number()),
  lastServiceDate: v.optional(v.number()),
  lastServiceHours: v.optional(v.number()),
  nextServiceDate: v.optional(v.number()),
  nextServiceHours: v.optional(v.number()),
  serviceIntervalDays: v.optional(v.number()),
  serviceIntervalHours: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### 2. Update `create` Mutation Args

Add optional service interval fields:

```typescript
args: {
  // ... existing args
  serviceIntervalDays: v.optional(v.number()),
  serviceIntervalHours: v.optional(v.number()),
}
```

Default values when inserting:

- serviceIntervalDays: args.serviceIntervalDays ?? 30
- serviceIntervalHours: args.serviceIntervalHours ?? 250

### 3. Update `update` Mutation Args

Add the new fields:

```typescript
args: {
  // ... existing args
  totalHoursUsed: v.optional(v.number()),
  lastServiceDate: v.optional(v.number()),
  lastServiceHours: v.optional(v.number()),
  nextServiceDate: v.optional(v.number()),
  nextServiceHours: v.optional(v.number()),
  serviceIntervalDays: v.optional(v.number()),
  serviceIntervalHours: v.optional(v.number()),
}
```

### 4. Add `getMaintenanceDue` Query

Returns equipment that needs preventive maintenance:

```typescript
export const getMaintenanceDue = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('equipment'),
      name: v.string(),
      category: equipmentCategory,
      status: equipmentStatus,
      totalHoursUsed: v.optional(v.number()),
      lastServiceDate: v.optional(v.number()),
      lastServiceHours: v.optional(v.number()),
      nextServiceDate: v.optional(v.number()),
      nextServiceHours: v.optional(v.number()),
      serviceIntervalDays: v.optional(v.number()),
      serviceIntervalHours: v.optional(v.number()),
      isTimeOverdue: v.boolean(),
      isHoursOverdue: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    // Auth check...

    const equipment = await ctx.db
      .query('equipment')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const now = Date.now()
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    return equipment
      .filter((e) => e.status !== 'rented')
      .map((e) => {
        const isTimeOverdue = e.nextServiceDate
          ? e.nextServiceDate <= now
          : false
        const isHoursOverdue =
          e.nextServiceHours && e.totalHoursUsed
            ? e.totalHoursUsed >= e.nextServiceHours
            : false
        return { ...e, isTimeOverdue, isHoursOverdue }
      })
      .filter((e) => e.isTimeOverdue || e.isHoursOverdue)
  },
})
```

### 5. Add `updateHours` Mutation

Updates total hours used (for tracking preventive maintenance by hours):

```typescript
export const updateHours = mutation({
  args: {
    id: v.id('equipment'),
    totalHoursUsed: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Auth check...

    await ctx.db.patch(args.id, {
      totalHoursUsed: args.totalHoursUsed,
      updatedAt: Date.now(),
    })
    return null
  },
})
```

### 6. Add `getWithMaintenanceHistory` Query

Returns equipment with its maintenance history (for equipment detail page):

```typescript
export const getWithMaintenanceHistory = query({
  args: { id: v.id('equipment') },
  returns: v.union(
    v.object({
      equipment: equipmentDoc,
      inspections: v.array(
        v.object({
          _id: v.id('inspections'),
          type: inspectionType,
          overallCondition: overallCondition,
          damageFound: v.boolean(),
          maintenanceRequired: v.boolean(),
          inspectorId: v.id('users'),
          inspectedAt: v.number(),
        }),
      ),
      maintenanceRecords: v.array(
        v.object({
          _id: v.id('maintenanceRecords'),
          source: maintenanceSource,
          workOrder: v.string(),
          status: maintenanceStatus,
          cost: v.optional(v.number()),
          completedAt: v.optional(v.number()),
          createdAt: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get equipment, verify ownership
    // Get inspections by equipment id
    // Get maintenance records by equipment id
    // Return combined object
  },
})
```

## Output

Update `convex/equipment.ts` with the changes above.
