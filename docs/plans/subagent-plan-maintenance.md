# Subagent Plan: Maintenance Records Convex Functions

## Task

Create `convex/maintenance.ts` with all CRUD operations and queue queries for maintenance work orders.

## Reference Files

- Pattern: `convex/equipment.ts` - follow the same patterns
- Pattern: `convex/rentals.ts` - follow the same auth/org verification patterns
- Schema: `convex/schema.ts` - maintenanceRecords table already defined

## Types to Define

```typescript
const maintenanceSource = v.union(
  v.literal('inspection_flagged'),
  v.literal('preventive_time'),
  v.literal('preventive_hours'),
)

const maintenanceStatus = v.union(
  v.literal('pending'),
  v.literal('in_progress'),
  v.literal('completed'),
)
```

## Functions to Implement

### 1. `getAll` Query

Returns all maintenance records for current org with denormalized equipment name.

```typescript
returns: v.array(
  v.object({
    _id: v.id('maintenanceRecords'),
    _creationTime: v.number(),
    organizationId: v.id('organizations'),
    equipmentId: v.id('equipment'),
    equipmentName: v.string(),
    source: maintenanceSource,
    inspectionId: v.optional(v.id('inspections')),
    workOrder: v.string(),
    status: maintenanceStatus,
    partsUsed: v.optional(v.string()),
    laborDescription: v.optional(v.string()),
    cost: v.optional(v.number()),
    hoursAtService: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
)
```

### 2. `getById` Query

Returns single maintenance record with equipment and linked inspection details.

### 3. `getByEquipmentId` Query

Returns all maintenance records for a specific piece of equipment.

- Use `by_equipment_id` index

### 4. `getQueue` Query

Returns maintenance queue items grouped by status:

```typescript
returns: v.object({
  flaggedFromInspections: v.array(
    v.object({
      _id: v.id('maintenanceRecords'),
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      workOrder: v.string(),
      inspectionId: v.optional(v.id('inspections')),
      createdAt: v.number(),
    }),
  ),
  preventiveDue: v.array(
    v.object({
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      source: v.union(
        v.literal('preventive_time'),
        v.literal('preventive_hours'),
      ),
      nextServiceDate: v.optional(v.number()),
      nextServiceHours: v.optional(v.number()),
      currentHours: v.optional(v.number()),
    }),
  ),
  inProgress: v.array(
    v.object({
      _id: v.id('maintenanceRecords'),
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      workOrder: v.string(),
      assignedTo: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  recentlyCompleted: v.array(
    v.object({
      _id: v.id('maintenanceRecords'),
      equipmentId: v.id('equipment'),
      equipmentName: v.string(),
      workOrder: v.string(),
      cost: v.optional(v.number()),
      completedAt: v.number(),
    }),
  ),
})
```

Logic for queues:

- **flaggedFromInspections**: status = 'pending', source = 'inspection_flagged'
- **preventiveDue**: Equipment where (nextServiceDate <= now OR nextServiceHours <= totalHoursUsed), no pending maintenance exists
- **inProgress**: status = 'in_progress'
- **recentlyCompleted**: status = 'completed', completedAt within last 30 days

### 5. `getStats` Query

Returns aggregate statistics:

```typescript
returns: v.object({
  total: v.number(),
  pending: v.number(),
  inProgress: v.number(),
  completed: v.number(),
  totalCost: v.number(),
  avgCompletionTime: v.number(), // hours
})
```

### 6. `create` Mutation

Creates a new maintenance record.

Args:

```typescript
{
  equipmentId: v.id('equipment'),
  source: maintenanceSource,
  inspectionId: v.optional(v.id('inspections')),
  workOrder: v.string(),
  assignedTo: v.optional(v.string()),
  notes: v.optional(v.string()),
}
```

Logic:

1. Verify auth and org
2. Insert with status = 'pending'
3. If equipment status != 'maintenance', update it to 'maintenance'

### 7. `update` Mutation

Updates an existing maintenance record.

Args:

```typescript
{
  id: v.id('maintenanceRecords'),
  workOrder: v.optional(v.string()),
  status: v.optional(maintenanceStatus),
  partsUsed: v.optional(v.string()),
  laborDescription: v.optional(v.string()),
  cost: v.optional(v.number()),
  hoursAtService: v.optional(v.number()),
  assignedTo: v.optional(v.string()),
  notes: v.optional(v.string()),
}
```

### 8. `markInProgress` Mutation

Sets status to 'in_progress'.

### 9. `markCompleted` Mutation

Marks maintenance as completed.

Args:

```typescript
{
  id: v.id('maintenanceRecords'),
  partsUsed: v.optional(v.string()),
  laborDescription: v.optional(v.string()),
  cost: v.optional(v.number()),
  hoursAtService: v.optional(v.number()),
  notes: v.optional(v.string()),
}
```

Logic:

1. Set status = 'completed'
2. Set completedAt = now
3. Update equipment:
   - lastServiceDate = now
   - lastServiceHours = hoursAtService OR equipment.totalHoursUsed
   - nextServiceDate = now + equipment.serviceIntervalDays (default 30) \* MS_PER_DAY
   - nextServiceHours = lastServiceHours + equipment.serviceIntervalHours (default 250)
   - status = 'available' (if no other pending maintenance)

### 10. `createFromInspection` Mutation

Convenience function to create maintenance from an inspection flag.

Args:

```typescript
{
  inspectionId: v.id('inspections'),
  workOrder: v.optional(v.string()), // default to maintenanceNotes from inspection
}
```

Logic:

1. Get inspection, verify it has maintenanceRequired = true
2. Create maintenance record with source = 'inspection_flagged'
3. Link the inspection

## Auth Pattern

Same as inspections - verify identity and org for all operations.

## Output File

`convex/maintenance.ts`
