# Subagent Plan: Maintenance Page UI

## Task

Create the unified Maintenance page with tabs for Inspections and Maintenance work orders.

## Reference Files

- Pattern: `src/routes/dashboard/rentals/index.tsx` - page structure, KPI cards, tables, dialogs
- Pattern: `src/routes/dashboard/rentals/-RentalForm.tsx` - form pattern
- Pattern: `src/routes/dashboard/equipment/$id.tsx` - detail sections

## Files to Create

### 1. `src/routes/dashboard/maintenance.tsx`

Main page with tabs.

### 2. `src/routes/dashboard/maintenance/-InspectionForm.tsx`

Form for creating/editing inspections.

### 3. `src/routes/dashboard/maintenance/-MaintenanceForm.tsx`

Form for creating/editing maintenance work orders.

### 4. `src/routes/dashboard/maintenance/-InspectionQueue.tsx`

Queue component for pending inspections.

### 5. `src/routes/dashboard/maintenance/-MaintenanceQueue.tsx`

Queue component for maintenance work orders.

---

## Page Structure: `maintenance.tsx`

### Imports

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// ... other imports
```

### KPI Cards

Show stats at top:

- Total Inspections
- Pending Maintenance
- In Progress
- Total Maintenance Cost

### Tabs Component

```typescript
<Tabs defaultValue="inspections" className="w-full">
  <TabsList>
    <TabsTrigger value="inspections">Inspections</TabsTrigger>
    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
  </TabsList>

  <TabsContent value="inspections">
    <InspectionQueue />
    {/* Inspection history table */}
  </TabsContent>

  <TabsContent value="maintenance">
    <MaintenanceQueue />
    {/* Maintenance history table */}
  </TabsContent>
</Tabs>
```

---

## InspectionForm Component

### Props

```typescript
{
  initialData?: Inspection // for edit
  equipmentId?: Id<'equipment'> // pre-selected from queue
  rentalId?: Id<'rentals'> // for pre/post rental
  type?: 'pre_rental' | 'post_rental' | 'routine'
  onSuccess: () => void
  onCancel: () => void
}
```

### State

- Equipment selection (or pre-filled)
- Inspection type
- Checklist results array
- Overall condition
- Damage section (found, description, cost)
- Maintenance required flag
- Photos array

### Checklist UI

Render each checklist item as a row with:

- Item name (label)
- Three buttons: OK / Needs Attention / N/A
- Optional notes field

```typescript
const CHECKLIST_ITEMS = [
  'Tires/Tracks',
  'Hydraulics',
  'Engine/Power',
  'Body/Frame',
  'Safety Features',
  'Fluids',
  'Controls',
  'Attachments',
]

// State: checklistResults: { item: string, status: string, notes: string }[]
```

### Photo Upload

Use Convex file storage:

1. Call `api.inspections.generateUploadUrl`
2. POST file to URL
3. Get storage ID
4. Store IDs in photos array

### Overall Condition

Radio group or button group:

- Excellent
- Good
- Fair
- Poor
- Damaged

### Submit Logic

Call `api.inspections.create` with all form data.

---

## MaintenanceForm Component

### Props

```typescript
{
  initialData?: MaintenanceRecord
  equipmentId?: Id<'equipment'>
  inspectionId?: Id<'inspections'> // from flagged inspection
  onSuccess: () => void
  onCancel: () => void
}
```

### Fields

- Equipment (select or pre-filled)
- Source (auto if from inspection)
- Work Order description (textarea)
- Status (pending/in_progress/completed)
- Assigned To (text)
- Parts Used (textarea)
- Labor Description (textarea)
- Cost (number)
- Hours at Service (number)
- Notes (textarea)

---

## InspectionQueue Component

### Sections

#### Pre-Rental Due

Table showing:

- Equipment name
- Customer name
- Start date
- Action: "Start Inspection" button

#### Post-Rental Due

Table showing:

- Equipment name
- Customer name
- Return date
- Action: "Start Inspection" button

#### Routine Overdue

Table showing:

- Equipment name
- Days overdue
- Next service date
- Action: "Start Inspection" button

#### Flagged from Inspection

Table showing:

- Equipment name
- Issue description
- Inspection date
- Action: "Create Work Order" button

---

## MaintenanceQueue Component

### Sections

#### Flagged from Inspections

Pending work orders from inspection flags.

#### Preventive Due

Equipment needing scheduled maintenance:

- Show if time-based or hours-based
- Equipment name
- Due date or hours threshold

#### In Progress

Active work orders:

- Equipment name
- Work order description
- Assigned to
- Started date
- Action: "Mark Complete" button

#### Recently Completed

Completed in last 30 days:

- Equipment name
- Work order
- Cost
- Completed date

---

## Styling

Use existing patterns:

- KPI cards with icon and trend
- Tables with alternating rows
- Dialogs for forms
- AlertDialogs for confirmations
- Badges for status
- Buttons with icons

### Status Badge Variants

```typescript
const INSPECTION_CONDITION_VARIANT = {
  excellent: 'default',
  good: 'default',
  fair: 'secondary',
  poor: 'outline',
  damaged: 'destructive',
}

const MAINTENANCE_STATUS_VARIANT = {
  pending: 'outline',
  in_progress: 'secondary',
  completed: 'default',
}
```

---

## Integration with Existing Pages

The sidebar already has a link to `/dashboard/maintenance`. The route should work automatically once the file is created.

---

## Output Files

1. `src/routes/dashboard/maintenance.tsx`
2. `src/routes/dashboard/maintenance/-InspectionForm.tsx`
3. `src/routes/dashboard/maintenance/-MaintenanceForm.tsx`
4. `src/routes/dashboard/maintenance/-InspectionQueue.tsx`
5. `src/routes/dashboard/maintenance/-MaintenanceQueue.tsx`
