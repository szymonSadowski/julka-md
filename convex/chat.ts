// convex/chat.ts
import { components, internal } from "./_generated/api";
import { Agent, vStreamArgs } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { action, query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { RAG } from "@convex-dev/rag";

const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

const chatAgent = new Agent(components.agent, {
  name: "chat-agent",
  languageModel: openai.chat("gpt-4o-mini"),
  instructions: `You are a helpful medical assistant integrated into a web application.
  
You have access to the user's uploaded medical documents and records.
  When answering questions, use the provided context from their documents to give accurate, personalized responses.
  
If the context doesn't contain relevant information, let the user know and provide general medical information if appropriate.
  Always be clear about what information comes from their documents versus general knowledge.`,
  maxSteps: 10,
});

export const createThread = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const { threadId } = await chatAgent.createThread(ctx, {
      userId: identity.subject ?? "anonymous",
    });

    return threadId;
  },
});

/**
 * Save user message and schedule RAG-enhanced response generation
 */
export const sendMessageToAgent = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    // Save the raw user message to the thread
    const { messageId } = await chatAgent.saveMessage(ctx, {
      threadId: args.threadId,
      prompt: args.prompt,
      skipEmbeddings: true, // We're in a mutation, embeddings will be added later
    });

    // Schedule async RAG processing and response generation
    await ctx.scheduler.runAfter(0, internal.chat.generateResponseWithRAG, {
      threadId: args.threadId,
      prompt: args.prompt,
      promptMessageId: messageId,
      namespace: identity.email ?? "global",
    });

    return { messageId };
  },
});

/**
 * Internal action to search RAG and generate AI response
 * This runs asynchronously after the user message is saved
 */
export const generateResponseWithRAG = internalAction({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    promptMessageId: v.string(),
    namespace: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Search the RAG index for relevant context
      const context = await rag.search(ctx, {
        namespace: args.namespace,
        query: args.prompt,
        limit: 3,
        chunkContext: { before: 1, after: 1 },
      });

      // Format prompt with context
      // Using markdown format with clear sections
      const enhancedPrompt =
        context.results.length > 0
          ? `# Context from user's documents:\n\n${context.text}\n\n---\n\n# User question:\n\n"""${args.prompt}"""`
          : args.prompt;

      // Override system prompt to instruct using the context
      const system =
        context.results.length > 0
          ? `### ROLA
Jesteś osobistym, precyzyjnym asystentem Julii, lekarza psychiatry. Twoim zadaniem jest wspieranie jej w analizie dostarczonych dokumentów medycznych i naukowych.

### GŁÓWNA ZASADA (RAG)
1. Twoja wiedza ogranicza się WYŁĄCZNIE do treści dostarczonych w sekcji "Context" (fragmenty plików).
2. IGNORUJ swoją wiedzę ogólną, medyczną i zewnętrzną, jeśli nie ma jej w dostarczonych plikach.
3. ZABRANIA SIĘ konfabulacji i halucynowania faktów. Jeśli informacji nie ma w tekście – nie wymyślaj.

### OBSŁUGA BRAKU DANYCH
Jeśli pytanie wykracza poza dostarczony kontekst lub kontekst jest niewystarczający, aby udzielić pewnej odpowiedzi, twoja JEDYNA odpowiedź to:
"Proszę zapytaj Adama, nie mam takich informacji."

### STYL I FORMA ODPOWIEDZI
- **Priorytet:** Przejrzystość i zwięzłość ponad poprawność gramatyczną.
- **Format:** Używaj punktorów (bullet points), krótkich zdań, równoważników zdań.
- **Język:**
  - Analizuj dokumenty w dowolnym języku (angielski, niemiecki, etc.).
  - Odpowiadaj ZAWSZE w języku, w którym Julia zadała pytanie (domyślnie Polski).
- **Konkret:** Bez lania wody. Bez wstępów typu "Jako model językowy...". Od razu sedno sprawy.

### PRZYKŁAD ZACHOWANIA
Kontekst: [Fragment artykułu o leczeniu depresji lekami SSRI u pacjentów 65+]
Pytanie Julii: Jakie dawkowanie dla seniorów?
Twoja odpowiedź:
- Start: 10mg dziennie.
- Max: 20mg po 2 tygodniach.
- Monitorować sód (ryzyko hiponatremii).

### INSTRUKCJE KOŃCOWE
Bazuj tylko na poniższych fragmentach. Bądź krótki.`
          : undefined; // Use agent's default instructions if no context

      const { thread } = await chatAgent.continueThread(ctx, {
        threadId: args.threadId,
      });

      // Set thread title on first message
      const metadata = await thread.getMetadata();
      if (!metadata.title || metadata.title === "Untitled Thread") {
        const title =
          args.prompt.length > 15
            ? args.prompt.slice(0, 15) + "..."
            : args.prompt;
        await thread.updateMetadata({ title });
      }

      // Generate response with RAG-enhanced prompt
      const result = await thread.streamText(
        {
          prompt: enhancedPrompt,
          promptMessageId: args.promptMessageId, // Associate response with user message
          system,
        },
        {
          saveStreamDeltas: true,
        }
      );

      await result.consumeStream();
    } catch (error) {
      console.error("RAG response generation failed:", error);

      // Fallback: generate response without RAG context
      const { thread } = await chatAgent.continueThread(ctx, {
        threadId: args.threadId,
      });

      const result = await thread.streamText(
        {
          prompt: args.prompt,
          promptMessageId: args.promptMessageId,
        },
        {
          saveStreamDeltas: true,
        }
      );

      await result.consumeStream();
    }
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const paginated = await chatAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
      excludeToolMessages: true,
    });

    const streams = await chatAgent.syncStreams(ctx, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });

    return { ...paginated, streams };
  },
});

/**
 * List all threads for the current user
 */
export const listUserThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject ?? "anonymous";
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId,
        paginationOpts: args.paginationOpts,
      }
    );

    return threads;
  },
});

/**
 * Delete a thread
 */
export const deleteThread = mutation({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    await chatAgent.deleteThreadAsync(ctx, { threadId: args.threadId });
  },
});
