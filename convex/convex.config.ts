// convex/convex.config.ts
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config.js";
import agent from "@convex-dev/agent/convex.config.js";

const app = defineApp();
app.use(rag);
app.use(agent);

export default app;
