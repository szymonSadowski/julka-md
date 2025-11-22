import {
  mutation,
  query,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a file URL from storage
 */
export const getFileUrl = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Save file metadata after upload
 */
export const saveFileMetadata = mutation({
  args: {
    ownerId: v.string(),
    fileName: v.string(),
    storageId: v.id("_storage"),
    ragEntryIds: v.optional(v.array(v.string())),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      ownerId: args.ownerId,
      fileName: args.fileName,
      storageId: args.storageId,
      uploadedAt: new Date().toISOString(),
      ragEntryIds: args.ragEntryIds,
    });
    return fileId;
  },
});

/**
 * List all files for a user
 */
export const listUserFiles = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .collect();

    return files;
  },
});

/**
 * Delete a file and its metadata (internal, use deleteUserFileWithRag action instead)
 */
export const deleteUserFile = internalMutation({
  args: {
    fileId: v.id("files"),
    ownerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the file metadata
    const file = await ctx.db.get(args.fileId);

    if (!file) {
      throw new Error("File not found");
    }

    // Verify ownership
    if (file.ownerId !== args.ownerId) {
      throw new Error("Unauthorized to delete this file");
    }

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete metadata
    await ctx.db.delete(args.fileId);

    return null;
  },
});

/**
 * Delete a file, its metadata, and its RAG entries
 */
export const deleteUserFileWithRag = action({
  args: {
    fileId: v.id("files"),
    ownerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the file metadata first
    const file = await ctx.runQuery(internal.files.getFileById, {
      fileId: args.fileId,
    });

    if (!file) {
      throw new Error("File not found");
    }

    // Verify ownership
    if (file.ownerId !== args.ownerId) {
      throw new Error("Unauthorized to delete this file");
    }

    // Delete from RAG if there are entries
    if (file.ragEntryIds && file.ragEntryIds.length > 0) {
      await ctx.runAction(internal.rag.deleteDocuments, {
        entryIds: file.ragEntryIds,
      });
    }

    // Delete file and metadata
    await ctx.runMutation(internal.files.deleteUserFile, {
      fileId: args.fileId,
      ownerId: args.ownerId,
    });

    return null;
  },
});

/**
 * Internal query to get file by ID
 */
export const getFileById = internalQuery({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId);
  },
});
