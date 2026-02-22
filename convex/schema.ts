import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const equipmentCategory = v.union(
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
)

const equipmentStatus = v.union(
  v.literal('available'),
  v.literal('rented'),
  v.literal('maintenance'),
)

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

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index('by_clerk_id', ['clerkId']),

  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  equipment: defineTable({
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
    .index('by_organization_id', ['organizationId'])
    .index('by_organization_id_and_status', ['organizationId', 'status']),

  customers: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_organization_id', ['organizationId']),

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
    .index('by_customer_id', ['customerId']),

  inspections: defineTable({
    organizationId: v.id('organizations'),
    equipmentId: v.id('equipment'),
    type: inspectionType,
    rentalId: v.optional(v.id('rentals')),
    checklistResults: v.array(
      v.object({
        item: v.string(),
        status: checklistItemStatus,
        notes: v.optional(v.string()),
      }),
    ),
    overallCondition: overallCondition,
    damageFound: v.boolean(),
    damageDescription: v.optional(v.string()),
    damageCost: v.optional(v.number()),
    maintenanceRequired: v.boolean(),
    maintenanceNotes: v.optional(v.string()),
    photos: v.optional(v.array(v.id('_storage'))),
    inspectorId: v.id('users'),
    inspectedAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_organization_id', ['organizationId'])
    .index('by_equipment_id', ['equipmentId'])
    .index('by_rental_id', ['rentalId']),

  maintenanceRecords: defineTable({
    organizationId: v.id('organizations'),
    equipmentId: v.id('equipment'),
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
  })
    .index('by_organization_id', ['organizationId'])
    .index('by_equipment_id', ['equipmentId'])
    .index('by_status', ['status'])
    .index('by_organization_id_and_status', ['organizationId', 'status']),
})
