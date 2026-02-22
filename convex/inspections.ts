import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

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

const inspectionWithEquipmentName = v.object({
  _id: v.id('inspections'),
  _creationTime: v.number(),
  organizationId: v.id('organizations'),
  equipmentId: v.id('equipment'),
  equipmentName: v.string(),
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
  inspectorId: v.id('users'),
  inspectedAt: v.number(),
  createdAt: v.number(),
})

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

export const getAll = query({
  args: {},
  returns: v.array(inspectionWithEquipmentName),
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

    const inspections = await ctx.db
      .query('inspections')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .order('desc')
      .collect()

    const results = await Promise.all(
      inspections.map(async (inspection) => {
        const equipment = await ctx.db.get(inspection.equipmentId)
        return {
          ...inspection,
          equipmentName: equipment?.name ?? 'Unknown Equipment',
        }
      }),
    )

    return results
  },
})

export const getById = query({
  args: { id: v.id('inspections') },
  returns: v.union(
    v.object({
      _id: v.id('inspections'),
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
      type: inspectionType,
      rentalId: v.optional(v.id('rentals')),
      rental: v.union(
        v.object({
          _id: v.id('rentals'),
          _creationTime: v.number(),
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
        }),
        v.null(),
      ),
      checklistResults: v.array(checklistResult),
      overallCondition: overallCondition,
      damageFound: v.boolean(),
      damageDescription: v.optional(v.string()),
      damageCost: v.optional(v.number()),
      maintenanceRequired: v.boolean(),
      maintenanceNotes: v.optional(v.string()),
      photos: v.optional(v.array(v.id('_storage'))),
      inspectorId: v.id('users'),
      inspector: v.union(
        v.object({
          _id: v.id('users'),
          _creationTime: v.number(),
          clerkId: v.string(),
          email: v.string(),
          name: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
        v.null(),
      ),
      inspectedAt: v.number(),
      createdAt: v.number(),
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

    const inspection = await ctx.db.get(args.id)
    if (!inspection || inspection.organizationId !== org._id) {
      return null
    }

    const equipment = await ctx.db.get(inspection.equipmentId)
    const inspector = await ctx.db.get(inspection.inspectorId)
    const rental = inspection.rentalId
      ? await ctx.db.get(inspection.rentalId)
      : null

    return {
      ...inspection,
      equipment,
      rental,
      inspector,
    }
  },
})

export const getByEquipmentId = query({
  args: { equipmentId: v.id('equipment') },
  returns: v.array(inspectionWithEquipmentName),
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

    const inspections = await ctx.db
      .query('inspections')
      .withIndex('by_equipment_id', (q) =>
        q.eq('equipmentId', args.equipmentId),
      )
      .order('desc')
      .collect()

    const results = await Promise.all(
      inspections.map(async (inspection) => {
        return {
          ...inspection,
          equipmentName: equipment.name,
        }
      }),
    )

    return results
  },
})

export const getByRentalId = query({
  args: { rentalId: v.id('rentals') },
  returns: v.array(inspectionWithEquipmentName),
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

    const rental = await ctx.db.get(args.rentalId)
    if (!rental || rental.organizationId !== org._id) {
      return []
    }

    const inspections = await ctx.db
      .query('inspections')
      .withIndex('by_rental_id', (q) => q.eq('rentalId', args.rentalId))
      .collect()

    const results = await Promise.all(
      inspections.map(async (inspection) => {
        const equipment = await ctx.db.get(inspection.equipmentId)
        return {
          ...inspection,
          equipmentName: equipment?.name ?? 'Unknown Equipment',
        }
      }),
    )

    return results
  },
})

export const getQueue = query({
  args: {},
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
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return {
        preRentalDue: [],
        postRentalDue: [],
        routineOverdue: [],
        flaggedFromInspection: [],
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
        preRentalDue: [],
        postRentalDue: [],
        routineOverdue: [],
        flaggedFromInspection: [],
      }
    }

    const now = Date.now()
    const todayStart = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
    const todayEnd = new Date(new Date(now).setHours(23, 59, 59, 999)).getTime()
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    const rentals = await ctx.db
      .query('rentals')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const inspections = await ctx.db
      .query('inspections')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const equipment = await ctx.db
      .query('equipment')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const maintenanceRecords = await ctx.db
      .query('maintenanceRecords')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const preRentalInspectionExists = new Set<string>()
    const postRentalInspectionExists = new Set<string>()

    for (const inspection of inspections) {
      if (inspection.rentalId) {
        const key = `${inspection.rentalId}`
        if (inspection.type === 'pre_rental') {
          preRentalInspectionExists.add(key)
        } else if (inspection.type === 'post_rental') {
          postRentalInspectionExists.add(key)
        }
      }
    }

    const preRentalDue: Array<{
      rentalId: import('./_generated/dataModel').Id<'rentals'>
      equipmentId: import('./_generated/dataModel').Id<'equipment'>
      equipmentName: string
      customerName: string
      startDate: number
    }> = []

    const postRentalDue: Array<{
      rentalId: import('./_generated/dataModel').Id<'rentals'>
      equipmentId: import('./_generated/dataModel').Id<'equipment'>
      equipmentName: string
      customerName: string
      returnDate: number
    }> = []

    for (const rental of rentals) {
      const equip = equipment.find((e) => e._id === rental.equipmentId)
      const customer = await ctx.db.get(rental.customerId)
      const equipmentName = equip?.name ?? 'Unknown Equipment'
      const customerName = customer?.name ?? 'Unknown Customer'

      if (rental.startDate >= todayStart && rental.startDate <= todayEnd) {
        if (!preRentalInspectionExists.has(rental._id)) {
          preRentalDue.push({
            rentalId: rental._id,
            equipmentId: rental.equipmentId,
            equipmentName,
            customerName,
            startDate: rental.startDate,
          })
        }
      }

      if (rental.returnDate && !postRentalInspectionExists.has(rental._id)) {
        postRentalDue.push({
          rentalId: rental._id,
          equipmentId: rental.equipmentId,
          equipmentName,
          customerName,
          returnDate: rental.returnDate,
        })
      }
    }

    const routineOverdue: Array<{
      equipmentId: import('./_generated/dataModel').Id<'equipment'>
      equipmentName: string
      nextServiceDate?: number
      daysOverdue: number
    }> = []

    for (const equip of equipment) {
      if (equip.status !== 'rented' && equip.nextServiceDate) {
        if (equip.nextServiceDate < now) {
          const daysOverdue = Math.floor(
            (now - equip.nextServiceDate) / MS_PER_DAY,
          )
          routineOverdue.push({
            equipmentId: equip._id,
            equipmentName: equip.name,
            nextServiceDate: equip.nextServiceDate,
            daysOverdue,
          })
        }
      }
    }

    const pendingMaintenanceInspectionIds = new Set<string>()
    for (const record of maintenanceRecords) {
      if (record.inspectionId && record.status === 'pending') {
        pendingMaintenanceInspectionIds.add(record.inspectionId)
      }
    }

    const flaggedFromInspection: Array<{
      inspectionId: import('./_generated/dataModel').Id<'inspections'>
      equipmentId: import('./_generated/dataModel').Id<'equipment'>
      equipmentName: string
      maintenanceNotes?: string
      inspectedAt: number
    }> = []

    for (const inspection of inspections) {
      if (
        inspection.maintenanceRequired &&
        !pendingMaintenanceInspectionIds.has(inspection._id)
      ) {
        const equip = equipment.find((e) => e._id === inspection.equipmentId)
        flaggedFromInspection.push({
          inspectionId: inspection._id,
          equipmentId: inspection.equipmentId,
          equipmentName: equip?.name ?? 'Unknown Equipment',
          maintenanceNotes: inspection.maintenanceNotes,
          inspectedAt: inspection.inspectedAt,
        })
      }
    }

    return {
      preRentalDue,
      postRentalDue,
      routineOverdue,
      flaggedFromInspection,
    }
  },
})

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    preRental: v.number(),
    postRental: v.number(),
    routine: v.number(),
    passedCount: v.number(),
    needsMaintenanceCount: v.number(),
    damageFoundCount: v.number(),
    totalDamageCost: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return {
        total: 0,
        preRental: 0,
        postRental: 0,
        routine: 0,
        passedCount: 0,
        needsMaintenanceCount: 0,
        damageFoundCount: 0,
        totalDamageCost: 0,
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
        preRental: 0,
        postRental: 0,
        routine: 0,
        passedCount: 0,
        needsMaintenanceCount: 0,
        damageFoundCount: 0,
        totalDamageCost: 0,
      }
    }

    const inspections = await ctx.db
      .query('inspections')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const total = inspections.length
    const preRental = inspections.filter((i) => i.type === 'pre_rental').length
    const postRental = inspections.filter(
      (i) => i.type === 'post_rental',
    ).length
    const routine = inspections.filter((i) => i.type === 'routine').length
    const passedCount = inspections.filter(
      (i) =>
        i.overallCondition === 'excellent' || i.overallCondition === 'good',
    ).length
    const needsMaintenanceCount = inspections.filter(
      (i) => i.maintenanceRequired,
    ).length
    const damageFoundCount = inspections.filter((i) => i.damageFound).length
    const totalDamageCost = inspections.reduce(
      (sum, i) => sum + (i.damageCost ?? 0),
      0,
    )

    return {
      total,
      preRental,
      postRental,
      routine,
      passedCount,
      needsMaintenanceCount,
      damageFoundCount,
      totalDamageCost,
    }
  },
})

export const create = mutation({
  args: {
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
  },
  returns: v.id('inspections'),
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

    const equipment = await ctx.db.get(args.equipmentId)
    if (!equipment || equipment.organizationId !== org._id) {
      throw new Error('Equipment not found')
    }

    if (args.rentalId) {
      const rental = await ctx.db.get(args.rentalId)
      if (!rental || rental.organizationId !== org._id) {
        throw new Error('Rental not found')
      }
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const now = Date.now()
    const inspectionId = await ctx.db.insert('inspections', {
      organizationId: org._id,
      equipmentId: args.equipmentId,
      type: args.type,
      rentalId: args.rentalId,
      checklistResults: args.checklistResults,
      overallCondition: args.overallCondition,
      damageFound: args.damageFound,
      damageDescription: args.damageDescription,
      damageCost: args.damageCost,
      maintenanceRequired: args.maintenanceRequired,
      maintenanceNotes: args.maintenanceNotes,
      photos: args.photos,
      inspectorId: user._id,
      inspectedAt: now,
      createdAt: now,
    })

    return inspectionId
  },
})

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Not authenticated')
    }
    return await ctx.storage.generateUploadUrl()
  },
})
