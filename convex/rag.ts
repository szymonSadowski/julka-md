// convex/rag.ts
import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { v } from "convex/values";
import { action, internalAction, query } from "./_generated/server";

const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536, // Needs to match your embedding model
});

export const insertDocuments = action({
  args: {
    content: v.string(),
    slug: v.string(),
    title: v.string(),
    hash: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const result = await rag.add(ctx, {
      namespace: identity.email ?? "global",
      title: args.title,
      contentHash: args.hash,
      key: args.slug,
      text: args.content,
    });

    return result;
  },
});

export const ragSearchDocuments = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const result = await rag.search(ctx, {
      namespace: identity.email ?? "global",
      query: args.query.trim(),
      limit: 10,
      vectorScoreThreshold: 0.3,
      chunkContext: { before: 1, after: 1 },
    });

    return result;
  },
});

export const deleteDocuments = internalAction({
  args: {
    entryIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Delete each document by entryId
    for (const entryId of args.entryIds) {
      await rag.delete(ctx, {
        entryId: entryId as string & { _: "EntryId" },
      });
    }

    return { deletedCount: args.entryIds.length };
  },
});
