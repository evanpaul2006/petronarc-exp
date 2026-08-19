import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Must stay in sync with `SystemId` in app/kart-systems.ts. */
export const systemId = v.union(
  v.literal("brake"),
  v.literal("chassis"),
  v.literal("steering"),
  v.literal("suspension"),
  v.literal("wheels"),
  v.literal("electrical"),
  v.literal("engine"),
  v.literal("seat"),
  v.literal("safety"),
  v.literal("assembly"),
);

/**
 * Attachments are links (Google Drive and friends), never uploaded bytes -- keeping
 * files out of Convex storage is the whole point.
 */
export const expenseImage = v.object({
  url: v.string(),
  name: v.optional(v.string()),
});

export const expenseFields = {
  systemId,
  name: v.string(),
  quantity: v.number(),
  unitPriceInr: v.number(),
  totalPriceInr: v.number(),
  description: v.optional(v.string()),
  images: v.optional(v.array(expenseImage)),
  date: v.string(),
  vendor: v.optional(v.string()),
  createdAt: v.number(),
};

export default defineSchema({
  expenses: defineTable(expenseFields)
    .index("by_system", ["systemId"])
    .index("by_createdAt", ["createdAt"]),
});
