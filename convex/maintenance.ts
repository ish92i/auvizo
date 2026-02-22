import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

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

const MS_PER_DAY = 24 * 60 * 60 * 1000

const maintenanceRecordWithEquipment = v.object({
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
})

export const getAll = query({
  args: {},
  returns: v.array(maintenanceRecordWithEquipment),
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

    const records = await ctx.db
      .query('maintenanceRecords')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .order('desc')
      .collect()

    const results = await Promise.all(
      records.map(async (record) => {
        const equipment = await ctx.db.get(record.equipmentId)
        return {
          ...record,
          equipmentName: equipment?.name ?? 'Unknown Equipment',
        }
      }),
    )

    return results
  },
})

export const getById = query({
  args: { id: v.id('maintenanceRecords') },
  returns: v.union(
    v.object({
      _id: v.id('maintenanceRecords'),
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
          lastServiceDate: v.optional(v.number()),
          lastServiceHours: v.optional(v.number()),
          nextServiceDate: v.optional(v.number()),
          nextServiceHours: v.optional(v.number()),
          serviceIntervalDays: v.optional(v.number()),
          serviceIntervalHours: v.optional(v.number()),
          createdAt: v.number(),
          updatedAt: v.number(),
        }),
        v.null(),
      ),
      source: maintenanceSource,
      inspectionId: v.optional(v.id('inspections')),
      inspection: v.union(
        v.object({
          _id: v.id('inspections'),
          _creationTime: v.number(),
          organizationId: v.id('organizations'),
          equipmentId: v.id('equipment'),
          type: v.union(
            v.literal('pre_rental'),
            v.literal('post_rental'),
            v.literal('routine'),
          ),
          rentalId: v.optional(v.id('rentals')),
          checklistResults: v.array(
            v.object({
              item: v.string(),
              status: v.union(
                v.literal('ok'),
                v.literal('needs_attention'),
                v.literal('not_applicable'),
              ),
              notes: v.optional(v.string()),
            }),
          ),
          overallCondition: v.union(
            v.literal('excellent'),
            v.literal('good'),
            v.literal('fair'),
            v.literal('poor'),
            v.literal('damaged'),
          ),
          damageFound: v.boolean(),
          damageDescription: v.optional(v.string()),
          damageCost: v.optional(v.number()),
          maintenanceRequired: v.boolean(),
          maintenanceNotes: v.optional(v.string()),
          photos: v.optional(v.array(v.id('_storage'))),
          inspectorId: v.id('users'),
          inspectedAt: v.number(),
          createdAt: v.number(),
        }),
        v.null(),
      ),
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

    const record = await ctx.db.get(args.id)
    if (!record || record.organizationId !== org._id) {
      return null
    }

    const equipment = await ctx.db.get(record.equipmentId)
    const inspection = record.inspectionId
      ? await ctx.db.get(record.inspectionId)
      : null

    return {
      ...record,
      equipment,
      inspection,
    }
  },
})

export const getByEquipmentId = query({
  args: { equipmentId: v.id('equipment') },
  returns: v.array(maintenanceRecordWithEquipment),
  handler: async (ctx, args) => {
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

    const equipment = await ctx.db.get(args.equipmentId)
    if (!equipment || equipment.organizationId !== org._id) {
      return []
    }

    const records = await ctx.db
      .query('maintenanceRecords')
      .withIndex('by_equipment_id', (q) =>
        q.eq('equipmentId', args.equipmentId),
      )
      .order('desc')
      .collect()

    const results = await Promise.all(
      records.map(async (record) => {
        return {
          ...record,
          equipmentName: equipment.name,
        }
      }),
    )

    return results
  },
})

export const getQueue = query({
  args: {},
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
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return {
        flaggedFromInspections: [],
        preventiveDue: [],
        inProgress: [],
        recentlyCompleted: [],
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
        flaggedFromInspections: [],
        preventiveDue: [],
        inProgress: [],
        recentlyCompleted: [],
      }
    }

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * MS_PER_DAY

    const allRecords = await ctx.db
      .query('maintenanceRecords')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const allEquipment = await ctx.db
      .query('equipment')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const equipmentMap = new Map(allEquipment.map((e) => [e._id, e]))

    const flaggedFromInspections = await Promise.all(
      allRecords
        .filter(
          (r) => r.status === 'pending' && r.source === 'inspection_flagged',
        )
        .map(async (r) => {
          const equipment = equipmentMap.get(r.equipmentId)
          return {
            _id: r._id,
            equipmentId: r.equipmentId,
            equipmentName: equipment?.name ?? 'Unknown Equipment',
            workOrder: r.workOrder,
            inspectionId: r.inspectionId,
            createdAt: r.createdAt,
          }
        }),
    )

    const pendingEquipmentIds = new Set(
      allRecords
        .filter((r) => r.status === 'pending' || r.status === 'in_progress')
        .map((r) => r.equipmentId),
    )

    const preventiveDue = allEquipment
      .filter((e) => !pendingEquipmentIds.has(e._id))
      .filter((e) => {
        const timeDue = e.nextServiceDate && e.nextServiceDate <= now
        const hoursDue =
          e.nextServiceHours &&
          e.totalHoursUsed &&
          e.nextServiceHours <= e.totalHoursUsed
        return timeDue || hoursDue
      })
      .map((e) => {
        const timeDue = e.nextServiceDate && e.nextServiceDate <= now
        return {
          equipmentId: e._id,
          equipmentName: e.name,
          source: timeDue
            ? ('preventive_time' as const)
            : ('preventive_hours' as const),
          nextServiceDate: e.nextServiceDate,
          nextServiceHours: e.nextServiceHours,
          currentHours: e.totalHoursUsed,
        }
      })

    const inProgress = await Promise.all(
      allRecords
        .filter((r) => r.status === 'in_progress')
        .map(async (r) => {
          const equipment = equipmentMap.get(r.equipmentId)
          return {
            _id: r._id,
            equipmentId: r.equipmentId,
            equipmentName: equipment?.name ?? 'Unknown Equipment',
            workOrder: r.workOrder,
            assignedTo: r.assignedTo,
            createdAt: r.createdAt,
          }
        }),
    )

    const recentlyCompleted = await Promise.all(
      allRecords
        .filter(
          (r) =>
            r.status === 'completed' &&
            r.completedAt &&
            r.completedAt >= thirtyDaysAgo,
        )
        .map(async (r) => {
          const equipment = equipmentMap.get(r.equipmentId)
          return {
            _id: r._id,
            equipmentId: r.equipmentId,
            equipmentName: equipment?.name ?? 'Unknown Equipment',
            workOrder: r.workOrder,
            cost: r.cost,
            completedAt: r.completedAt!,
          }
        }),
    )

    return {
      flaggedFromInspections,
      preventiveDue,
      inProgress,
      recentlyCompleted,
    }
  },
})

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    pending: v.number(),
    inProgress: v.number(),
    completed: v.number(),
    totalCost: v.number(),
    avgCompletionTime: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        totalCost: 0,
        avgCompletionTime: 0,
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
        pending: 0,
        inProgress: 0,
        completed: 0,
        totalCost: 0,
        avgCompletionTime: 0,
      }
    }

    const records = await ctx.db
      .query('maintenanceRecords')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const pending = records.filter((r) => r.status === 'pending').length
    const inProgress = records.filter((r) => r.status === 'in_progress').length
    const completed = records.filter((r) => r.status === 'completed').length
    const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0)

    const completedRecords = records.filter(
      (r) => r.status === 'completed' && r.completedAt,
    )
    const totalCompletionMs = completedRecords.reduce((sum, r) => {
      return sum + (r.completedAt! - r.createdAt)
    }, 0)
    const avgCompletionTime =
      completedRecords.length > 0
        ? totalCompletionMs / completedRecords.length / (60 * 60 * 1000)
        : 0

    return {
      total: records.length,
      pending,
      inProgress,
      completed,
      totalCost,
      avgCompletionTime,
    }
  },
})

export const create = mutation({
  args: {
    equipmentId: v.id('equipment'),
    source: maintenanceSource,
    inspectionId: v.optional(v.id('inspections')),
    workOrder: v.string(),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id('maintenanceRecords'),
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

    const equipment = await ctx.db.get(args.equipmentId)
    if (!equipment || equipment.organizationId !== org._id) {
      throw new Error('Equipment not found')
    }

    const now = Date.now()
    const recordId = await ctx.db.insert('maintenanceRecords', {
      organizationId: org._id,
      equipmentId: args.equipmentId,
      source: args.source,
      inspectionId: args.inspectionId,
      workOrder: args.workOrder,
      status: 'pending',
      assignedTo: args.assignedTo,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    })

    if (equipment.status !== 'maintenance') {
      await ctx.db.patch(args.equipmentId, {
        status: 'maintenance',
        updatedAt: now,
      })
    }

    return recordId
  },
})

export const update = mutation({
  args: {
    id: v.id('maintenanceRecords'),
    workOrder: v.optional(v.string()),
    status: v.optional(maintenanceStatus),
    partsUsed: v.optional(v.string()),
    laborDescription: v.optional(v.string()),
    cost: v.optional(v.number()),
    hoursAtService: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
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

    const record = await ctx.db.get(args.id)
    if (!record || record.organizationId !== org._id) {
      throw new Error('Maintenance record not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    if (args.workOrder !== undefined) updates.workOrder = args.workOrder
    if (args.status !== undefined) updates.status = args.status
    if (args.partsUsed !== undefined) updates.partsUsed = args.partsUsed
    if (args.laborDescription !== undefined)
      updates.laborDescription = args.laborDescription
    if (args.cost !== undefined) updates.cost = args.cost
    if (args.hoursAtService !== undefined)
      updates.hoursAtService = args.hoursAtService
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo
    if (args.notes !== undefined) updates.notes = args.notes

    await ctx.db.patch(args.id, updates)
    return null
  },
})

export const markInProgress = mutation({
  args: { id: v.id('maintenanceRecords') },
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

    const record = await ctx.db.get(args.id)
    if (!record || record.organizationId !== org._id) {
      throw new Error('Maintenance record not found')
    }

    await ctx.db.patch(args.id, {
      status: 'in_progress',
      updatedAt: Date.now(),
    })
    return null
  },
})

export const markCompleted = mutation({
  args: {
    id: v.id('maintenanceRecords'),
    partsUsed: v.optional(v.string()),
    laborDescription: v.optional(v.string()),
    cost: v.optional(v.number()),
    hoursAtService: v.optional(v.number()),
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

    const record = await ctx.db.get(args.id)
    if (!record || record.organizationId !== org._id) {
      throw new Error('Maintenance record not found')
    }

    const equipment = await ctx.db.get(record.equipmentId)
    if (!equipment) {
      throw new Error('Equipment not found')
    }

    const now = Date.now()

    const updates: Record<string, unknown> = {
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    }
    if (args.partsUsed !== undefined) updates.partsUsed = args.partsUsed
    if (args.laborDescription !== undefined)
      updates.laborDescription = args.laborDescription
    if (args.cost !== undefined) updates.cost = args.cost
    if (args.hoursAtService !== undefined)
      updates.hoursAtService = args.hoursAtService
    if (args.notes !== undefined) updates.notes = args.notes

    await ctx.db.patch(args.id, updates)

    const lastServiceHours =
      args.hoursAtService ?? equipment.totalHoursUsed ?? 0
    const serviceIntervalDays = equipment.serviceIntervalDays ?? 30
    const serviceIntervalHours = equipment.serviceIntervalHours ?? 250
    const nextServiceDate = now + serviceIntervalDays * MS_PER_DAY
    const nextServiceHours = lastServiceHours + serviceIntervalHours

    const otherPendingMaintenance = await ctx.db
      .query('maintenanceRecords')
      .withIndex('by_equipment_id', (q) =>
        q.eq('equipmentId', record.equipmentId),
      )
      .filter((q) =>
        q.and(
          q.neq(q.field('_id'), args.id),
          q.or(
            q.eq(q.field('status'), 'pending'),
            q.eq(q.field('status'), 'in_progress'),
          ),
        ),
      )
      .first()

    const equipmentUpdates: Record<string, unknown> = {
      lastServiceDate: now,
      lastServiceHours,
      nextServiceDate,
      nextServiceHours,
      updatedAt: now,
    }

    if (!otherPendingMaintenance) {
      equipmentUpdates.status = 'available'
    }

    await ctx.db.patch(record.equipmentId, equipmentUpdates)

    return null
  },
})

export const createFromInspection = mutation({
  args: {
    inspectionId: v.id('inspections'),
    workOrder: v.optional(v.string()),
  },
  returns: v.id('maintenanceRecords'),
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

    const inspection = await ctx.db.get(args.inspectionId)
    if (!inspection || inspection.organizationId !== org._id) {
      throw new Error('Inspection not found')
    }

    if (!inspection.maintenanceRequired) {
      throw new Error(
        'This inspection does not require maintenance. Set maintenanceRequired to true.',
      )
    }

    const now = Date.now()
    const recordId = await ctx.db.insert('maintenanceRecords', {
      organizationId: org._id,
      equipmentId: inspection.equipmentId,
      source: 'inspection_flagged',
      inspectionId: args.inspectionId,
      workOrder:
        args.workOrder ??
        inspection.maintenanceNotes ??
        'Maintenance required from inspection',
      status: 'pending',
      notes: inspection.maintenanceNotes,
      createdAt: now,
      updatedAt: now,
    })

    const equipment = await ctx.db.get(inspection.equipmentId)
    if (equipment && equipment.status !== 'maintenance') {
      await ctx.db.patch(inspection.equipmentId, {
        status: 'maintenance',
        updatedAt: now,
      })
    }

    return recordId
  },
})
