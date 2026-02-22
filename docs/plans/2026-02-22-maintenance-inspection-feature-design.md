# Maintenance & Inspection Feature Design

## Overview

This feature enables equipment rental companies to track the physical health of their fleet through inspections and maintenance work orders. It answers: "What is broken? What should I inspect?"

## Requirements Summary

- **Both workflows**: Inspection + Maintenance together
- **Photos**: Convex file storage
- **Inspection types**: Pre-rental, Post-rental, Routine
- **Preventive scheduling**: Time + Hours based
- **Damage billing**: Record damage cost for post-rental
- **Checklists**: Structured checklist items
- **UI**: Unified page with tabs

## Database Schema

### inspections table

```typescript
{
  organizationId: Id<"organizations">,
  equipmentId: Id<"equipment">,
  type: "pre_rental" | "post_rental" | "routine",
  rentalId?: Id<"rentals">,

  checklistResults: [{
    item: string,
    status: "ok" | "needs_attention" | "not_applicable",
    notes?: string
  }],

  overallCondition: "excellent" | "good" | "fair" | "poor" | "damaged",
  damageFound: boolean,
  damageDescription?: string,
  damageCost?: number,

  maintenanceRequired: boolean,
  maintenanceNotes?: string,

  photos: Id<"_storage">[],

  inspectorId: Id<"users">,
  inspectedAt: number,
  createdAt: number
}
```

**Indexes:**

- `by_organization_id`
- `by_equipment_id`
- `by_rental_id`

### maintenance_records table

```typescript
{
  organizationId: Id<"organizations">,
  equipmentId: Id<"equipment">,

  source: "inspection_flagged" | "preventive_time" | "preventive_hours",
  inspectionId?: Id<"inspections">,

  workOrder: string,
  status: "pending" | "in_progress" | "completed",

  partsUsed?: string,
  laborDescription?: string,
  cost?: number,
  hoursAtService?: number,

  assignedTo?: string,
  notes?: string,

  completedAt?: number,
  createdAt: number,
  updatedAt: number
}
```

**Indexes:**

- `by_organization_id`
- `by_equipment_id`
- `by_status`
- `by_organization_id_and_status`

### Equipment table additions

Add fields for preventive maintenance tracking:

```typescript
{
  // ... existing fields
  lastServiceDate?: number,
  lastServiceHours?: number,
  nextServiceDate?: number,      // Calculated: lastServiceDate + 30 days
  nextServiceHours?: number,     // Calculated: lastServiceHours + 250
  serviceIntervalDays?: number,  // Default: 30
  serviceIntervalHours?: number, // Default: 250
}
```

## Checklist Items

Standard checklist for all inspections:

1. **Tires/Tracks** - Condition check
2. **Hydraulics** - Leaks and operation
3. **Engine/Power** - Starts and runs properly
4. **Body/Frame** - Dents, cracks, damage
5. **Safety Features** - Lights, alarms, guards
6. **Fluids** - Oil, coolant, hydraulic fluid levels
7. **Controls** - All controls functional
8. **Attachments** - Buckets, forks, etc. (if applicable)

## UI Structure

### /dashboard/maintenance (Unified Page)

**Tab 1: Inspections**

- **Queue Section:**
  - Pre-rental due today (rentals starting today, no inspection)
  - Post-rental due (returned rentals, no inspection)
  - Routine overdue (equipment with next inspection date passed)
  - Flagged from inspection (maintenance required)
- **History Section:** Table of past inspections with filters

**Tab 2: Maintenance**

- **Queue Section:**
  - Flagged from inspections (reactive)
  - Preventive due (time-based or hours-based)
  - In progress (work orders assigned, not complete)
- **History Section:** Completed maintenance records

### Inspection Form

Dialog with:

- Equipment selection (or pre-filled from queue)
- Inspection type selector
- Checklist items with status buttons (OK / Needs Attention / N/A)
- Notes field per item
- Overall condition rating (5-point scale)
- Damage section (condition + description + cost)
- Maintenance flag section
- Photo upload
- Inspector auto-filled from current user

### Maintenance Work Order Form

Dialog with:

- Equipment selection (or pre-filled from queue)
- Source (auto: inspection flagged / preventive)
- Work order description
- Status selector
- Assigned to (text field for mechanic name)
- Completion section (parts, labor, cost, hours at service)

## Integration Points

### Rentals

- **Pre-rental**: Before handover, create pre-rental inspection. Can block if failed.
- **Post-rental**: When equipment returns, create post-rental inspection. Update equipment status to available only after inspection.

### Equipment Detail Page

- Add "Inspection History" section
- Add "Maintenance History" section
- Show next service due date/hours

### Home Dashboard

- Alert cards: "3 inspections due today", "2 maintenance items flagged"

## Implementation Order

1. **Schema changes** - Add tables and indexes
2. **Convex functions** - inspections.ts and maintenance.ts
3. **File upload** - Photo storage integration
4. **Maintenance page** - Unified UI with tabs
5. **Equipment detail** - History sections
6. **Rental integration** - Pre/post rental workflow
7. **Dashboard alerts** - Home page integration
