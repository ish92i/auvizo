import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const customerDoc = v.object({
  _id: v.id('customers'),
  _creationTime: v.number(),
  organizationId: v.id('organizations'),
  name: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const getAll = query({
  args: {},
  returns: v.array(customerDoc),
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
      .query('customers')
      .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('customers') },
  returns: v.union(customerDoc, v.null()),
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

    const customer = await ctx.db.get(args.id)
    if (!customer || customer.organizationId !== org._id) {
      return null
    }

    return customer
  },
})

export const remove = mutation({
  args: { id: v.id('customers') },
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

    const customer = await ctx.db.get(args.id)
    if (!customer || customer.organizationId !== org._id) {
      throw new Error('Customer not found')
    }

    await ctx.db.delete(args.id)
    return null
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id('customers'),
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
    return await ctx.db.insert('customers', {
      organizationId: org._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('customers'),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
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

    const customer = await ctx.db.get(args.id)
    if (!customer || customer.organizationId !== org._id) {
      throw new Error('Customer not found')
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      notes: args.notes,
      updatedAt: Date.now(),
    })
    return null
  },
})
