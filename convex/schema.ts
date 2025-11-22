import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    ownerId: v.string(),
    fileName: v.string(),
    storageId: v.id("_storage"),
    uploadedAt: v.string(),
    ragEntryIds: v.optional(v.array(v.string())), // Store RAG entry IDs for deletion
  }).index("by_ownerId", ["ownerId"]),
});
