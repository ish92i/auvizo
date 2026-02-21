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
})
