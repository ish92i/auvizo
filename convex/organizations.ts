import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const current = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      clerkOrgId: v.string(),
      name: v.string(),
      slug: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.orgId) {
      return null
    }

    return await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", identity.orgId as string))
      .unique()
  },
})

export const store = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique()

    if (existingOrg) {
      if (
        existingOrg.name !== args.name ||
        existingOrg.slug !== args.slug ||
        existingOrg.imageUrl !== args.imageUrl
      ) {
        await ctx.db.patch(existingOrg._id, {
          name: args.name,
          slug: args.slug,
          imageUrl: args.imageUrl,
        })
      }
      return existingOrg._id
    }

    return await ctx.db.insert("organizations", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      slug: args.slug,
      imageUrl: args.imageUrl,
    })
  },
})

export const upsertFromClerk = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique()

    if (existingOrg) {
      await ctx.db.patch(existingOrg._id, {
        name: args.name,
        slug: args.slug,
        imageUrl: args.imageUrl,
      })
      return existingOrg._id
    }

    return await ctx.db.insert("organizations", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      slug: args.slug,
      imageUrl: args.imageUrl,
    })
  },
})

export const getByClerkId = query({
  args: { clerkOrgId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      clerkOrgId: v.string(),
      name: v.string(),
      slug: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique()
  },
})
