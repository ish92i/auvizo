import { query, mutation } from './_generated/server'
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

export const getAll = query({
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
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('equipment') },
  returns: v.union(equipmentDoc, v.null()),
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

    const equipment = await ctx.db.get(args.id)
    if (!equipment || equipment.organizationId !== org._id) {
      return null
    }

    return equipment
  },
})

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    available: v.number(),
    rented: v.number(),
    maintenance: v.number(),
    totalAssetValue: v.number(),
    utilizationRate: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return {
        total: 0,
        available: 0,
        rented: 0,
        maintenance: 0,
        totalAssetValue: 0,
        utilizationRate: 0,
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
        available: 0,
        rented: 0,
        maintenance: 0,
        totalAssetValue: 0,
        utilizationRate: 0,
      }
    }

    const equipments = await ctx.db
      .query('equipment')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const total = equipments.length
    const available = equipments.filter((e) => e.status === 'available').length
    const rented = equipments.filter((e) => e.status === 'rented').length
    const maintenance = equipments.filter(
      (e) => e.status === 'maintenance',
    ).length
    const totalAssetValue = equipments.reduce((sum, e) => sum + e.assetValue, 0)
    const utilizationRate = total > 0 ? (rented / total) * 100 : 0

    return {
      total,
      available,
      rented,
      maintenance,
      totalAssetValue,
      utilizationRate,
    }
  },
})

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

    const equipment = await ctx.db
      .query('equipment')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const now = Date.now()

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
        return {
          _id: e._id,
          name: e.name,
          category: e.category,
          status: e.status,
          totalHoursUsed: e.totalHoursUsed,
          lastServiceDate: e.lastServiceDate,
          lastServiceHours: e.lastServiceHours,
          nextServiceDate: e.nextServiceDate,
          nextServiceHours: e.nextServiceHours,
          serviceIntervalDays: e.serviceIntervalDays,
          serviceIntervalHours: e.serviceIntervalHours,
          isTimeOverdue,
          isHoursOverdue,
        }
      })
      .filter((e) => e.isTimeOverdue || e.isHoursOverdue)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    category: equipmentCategory,
    status: equipmentStatus,
    assetValue: v.number(),
    notes: v.optional(v.string()),
    totalHoursUsed: v.optional(v.number()),
    serviceIntervalDays: v.optional(v.number()),
    serviceIntervalHours: v.optional(v.number()),
  },
  returns: v.id('equipment'),
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
    return await ctx.db.insert('equipment', {
      organizationId: org._id,
      name: args.name,
      category: args.category,
      status: args.status,
      assetValue: args.assetValue,
      notes: args.notes,
      totalHoursUsed: args.totalHoursUsed,
      serviceIntervalDays: args.serviceIntervalDays ?? 30,
      serviceIntervalHours: args.serviceIntervalHours ?? 250,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('equipment'),
    name: v.optional(v.string()),
    category: v.optional(equipmentCategory),
    status: v.optional(equipmentStatus),
    assetValue: v.optional(v.number()),
    notes: v.optional(v.string()),
    totalHoursUsed: v.optional(v.number()),
    lastServiceDate: v.optional(v.number()),
    lastServiceHours: v.optional(v.number()),
    nextServiceDate: v.optional(v.number()),
    nextServiceHours: v.optional(v.number()),
    serviceIntervalDays: v.optional(v.number()),
    serviceIntervalHours: v.optional(v.number()),
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

    const equipment = await ctx.db.get(args.id)
    if (!equipment || equipment.organizationId !== org._id) {
      throw new Error('Equipment not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    if (args.name !== undefined) updates.name = args.name
    if (args.category !== undefined) updates.category = args.category
    if (args.status !== undefined) updates.status = args.status
    if (args.assetValue !== undefined) updates.assetValue = args.assetValue
    if (args.notes !== undefined) updates.notes = args.notes
    if (args.totalHoursUsed !== undefined)
      updates.totalHoursUsed = args.totalHoursUsed
    if (args.lastServiceDate !== undefined)
      updates.lastServiceDate = args.lastServiceDate
    if (args.lastServiceHours !== undefined)
      updates.lastServiceHours = args.lastServiceHours
    if (args.nextServiceDate !== undefined)
      updates.nextServiceDate = args.nextServiceDate
    if (args.nextServiceHours !== undefined)
      updates.nextServiceHours = args.nextServiceHours
    if (args.serviceIntervalDays !== undefined)
      updates.serviceIntervalDays = args.serviceIntervalDays
    if (args.serviceIntervalHours !== undefined)
      updates.serviceIntervalHours = args.serviceIntervalHours

    await ctx.db.patch(args.id, updates)
    return null
  },
})

export const updateHours = mutation({
  args: {
    id: v.id('equipment'),
    totalHoursUsed: v.number(),
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

    const equipment = await ctx.db.get(args.id)
    if (!equipment || equipment.organizationId !== org._id) {
      throw new Error('Equipment not found')
    }

    await ctx.db.patch(args.id, {
      totalHoursUsed: args.totalHoursUsed,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id('equipment'),
    status: equipmentStatus,
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

    const equipment = await ctx.db.get(args.id)
    if (!equipment || equipment.organizationId !== org._id) {
      throw new Error('Equipment not found')
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const remove = mutation({
  args: { id: v.id('equipment') },
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

    const equipment = await ctx.db.get(args.id)
    if (!equipment || equipment.organizationId !== org._id) {
      throw new Error('Equipment not found')
    }

    await ctx.db.delete(args.id)
    return null
  },
})

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

    const equipment = await ctx.db.get(args.id)
    if (!equipment || equipment.organizationId !== org._id) {
      return null
    }

    const inspections = await ctx.db
      .query('inspections')
      .withIndex('by_equipment_id', (q) => q.eq('equipmentId', args.id))
      .order('desc')
      .collect()

    const maintenanceRecords = await ctx.db
      .query('maintenanceRecords')
      .withIndex('by_equipment_id', (q) => q.eq('equipmentId', args.id))
      .order('desc')
      .collect()

    return {
      equipment,
      inspections: inspections.map((i) => ({
        _id: i._id,
        type: i.type,
        overallCondition: i.overallCondition,
        damageFound: i.damageFound,
        maintenanceRequired: i.maintenanceRequired,
        inspectorId: i.inspectorId,
        inspectedAt: i.inspectedAt,
      })),
      maintenanceRecords: maintenanceRecords.map((m) => ({
        _id: m._id,
        source: m.source,
        workOrder: m.workOrder,
        status: m.status,
        cost: m.cost,
        completedAt: m.completedAt,
        createdAt: m.createdAt,
      })),
    }
  },
})
