import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const rentalWithDetails = v.object({
  _id: v.id('rentals'),
  _creationTime: v.number(),
  organizationId: v.id('organizations'),
  equipmentId: v.id('equipment'),
  equipmentName: v.string(),
  customerId: v.id('customers'),
  customerName: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  returnDate: v.optional(v.number()),
  dailyRate: v.number(),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

function getRentalStatus(
  rental: { endDate: number; returnDate?: number },
  now: number = Date.now(),
): 'active' | 'returned' | 'overdue' {
  if (rental.returnDate) return 'returned'
  if (now > rental.endDate) return 'overdue'
  return 'active'
}

export const getAll = query({
  args: {},
  returns: v.array(rentalWithDetails),
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

    const rentals = await ctx.db
      .query('rentals')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .order('desc')
      .collect()

    const results = await Promise.all(
      rentals.map(async (rental) => {
        const equipment = await ctx.db.get(rental.equipmentId)
        const customer = await ctx.db.get(rental.customerId)
        return {
          ...rental,
          equipmentName: equipment?.name ?? 'Unknown Equipment',
          customerName: customer?.name ?? 'Unknown Customer',
        }
      }),
    )

    return results
  },
})

export const getById = query({
  args: { id: v.id('rentals') },
  returns: v.union(
    v.object({
      _id: v.id('rentals'),
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
          createdAt: v.number(),
          updatedAt: v.number(),
        }),
        v.null(),
      ),
      customerId: v.id('customers'),
      customer: v.union(
        v.object({
          _id: v.id('customers'),
          _creationTime: v.number(),
          organizationId: v.id('organizations'),
          name: v.string(),
          email: v.optional(v.string()),
          phone: v.optional(v.string()),
          notes: v.optional(v.string()),
          createdAt: v.number(),
          updatedAt: v.number(),
        }),
        v.null(),
      ),
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

    const rental = await ctx.db.get(args.id)
    if (!rental || rental.organizationId !== org._id) {
      return null
    }

    const equipment = await ctx.db.get(rental.equipmentId)
    const customer = await ctx.db.get(rental.customerId)

    return {
      ...rental,
      equipment,
      customer,
    }
  },
})

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    active: v.number(),
    returned: v.number(),
    overdue: v.number(),
    totalRevenue: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return {
        total: 0,
        active: 0,
        returned: 0,
        overdue: 0,
        totalRevenue: 0,
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
        active: 0,
        returned: 0,
        overdue: 0,
        totalRevenue: 0,
      }
    }

    const rentals = await ctx.db
      .query('rentals')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .collect()

    const now = Date.now()
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    let active = 0
    let returned = 0
    let overdue = 0
    let totalRevenue = 0

    for (const rental of rentals) {
      const status = getRentalStatus(rental, now)
      if (status === 'active') active++
      else if (status === 'returned') returned++
      else if (status === 'overdue') overdue++

      if (rental.returnDate) {
        const days = Math.max(
          1,
          Math.ceil((rental.returnDate - rental.startDate) / MS_PER_DAY),
        )
        totalRevenue += days * rental.dailyRate
      }
    }

    return {
      total: rentals.length,
      active,
      returned,
      overdue,
      totalRevenue,
    }
  },
})

export const create = mutation({
  args: {
    equipmentId: v.id('equipment'),
    customerId: v.id('customers'),
    startDate: v.number(),
    endDate: v.number(),
    dailyRate: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id('rentals'),
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

    if (equipment.status !== 'available') {
      throw new Error(
        `Equipment is not available for rent. Current status: ${equipment.status}`,
      )
    }

    const now = Date.now()
    const rentalId = await ctx.db.insert('rentals', {
      organizationId: org._id,
      equipmentId: args.equipmentId,
      customerId: args.customerId,
      startDate: args.startDate,
      endDate: args.endDate,
      dailyRate: args.dailyRate,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(args.equipmentId, {
      status: 'rented',
      updatedAt: now,
    })

    return rentalId
  },
})

export const markReturned = mutation({
  args: {
    id: v.id('rentals'),
    returnDate: v.optional(v.number()),
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

    const rental = await ctx.db.get(args.id)
    if (!rental || rental.organizationId !== org._id) {
      throw new Error('Rental not found')
    }

    if (rental.returnDate) {
      throw new Error('This rental has already been marked as returned')
    }

    const now = Date.now()
    await ctx.db.patch(args.id, {
      returnDate: args.returnDate ?? now,
      updatedAt: now,
    })

    await ctx.db.patch(rental.equipmentId, {
      status: 'available',
      updatedAt: now,
    })

    return null
  },
})

export const update = mutation({
  args: {
    id: v.id('rentals'),
    endDate: v.optional(v.number()),
    dailyRate: v.optional(v.number()),
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

    const rental = await ctx.db.get(args.id)
    if (!rental || rental.organizationId !== org._id) {
      throw new Error('Rental not found')
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    if (args.endDate !== undefined) updates.endDate = args.endDate
    if (args.dailyRate !== undefined) updates.dailyRate = args.dailyRate
    if (args.notes !== undefined) updates.notes = args.notes

    await ctx.db.patch(args.id, updates)
    return null
  },
})
