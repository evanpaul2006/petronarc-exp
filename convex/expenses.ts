import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { expenseFields, expenseImage, systemId } from "./schema";

/** Fields the client supplies. `totalPriceInr` and `createdAt` are computed server side. */
const inputFields = {
  systemId,
  name: v.string(),
  quantity: v.number(),
  unitPriceInr: v.number(),
  description: v.optional(v.string()),
  images: v.optional(v.array(expenseImage)),
  date: v.string(),
  vendor: v.optional(v.string()),
};

function totalFor(quantity: number, unitPriceInr: number): number {
  return Math.round(Number(quantity) * Number(unitPriceInr));
}

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("expenses").withIndex("by_createdAt").order("desc").collect(),
});

export const getBySystem = query({
  args: { systemId },
  handler: (ctx, args) =>
    ctx.db
      .query("expenses")
      .withIndex("by_system", (q) => q.eq("systemId", args.systemId))
      .collect(),
});

export const add = mutation({
  args: inputFields,
  handler: (ctx, args) =>
    ctx.db.insert("expenses", {
      ...args,
      totalPriceInr: totalFor(args.quantity, args.unitPriceInr),
      createdAt: Date.now(),
    }),
});

export const update = mutation({
  args: { id: v.id("expenses"), ...inputFields },
  handler: async (ctx, { id, ...updates }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error(`Expense ${id} no longer exists.`);
    await ctx.db.patch(id, {
      ...updates,
      totalPriceInr: totalFor(updates.quantity, updates.unitPriceInr),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    if (await ctx.db.get(id)) await ctx.db.delete(id);
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("expenses").collect();
    await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)));
  },
});

/**
 * Replaces the ledger with `items`. Backs both the sample-data seed and JSON restore,
 * which are the same operation from the database's point of view.
 */
export const bulkImport = mutation({
  args: { items: v.array(v.object(expenseFields)) },
  handler: async (ctx, { items }) => {
    const existing = await ctx.db.query("expenses").collect();
    await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)));
    await Promise.all(items.map((item) => ctx.db.insert("expenses", item)));
  },
});
