import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import type Elysia from "elysia";

import { aiTrainingQueue } from "#/features/ai/ai.queue";

// import { authPlugin } from "~/features/auth/auth.plugin";

const serverAdapter = new ElysiaAdapter("/api/v1/queues");

const queues = [new BullMQAdapter(aiTrainingQueue)];

createBullBoard({
  queues,
  serverAdapter,
  options: {
    // This configuration fixes a build error on Bun caused by eval (https://github.com/oven-sh/bun/issues/5809#issuecomment-2065310008)
    // uiBasePath: 'node_modules/@bull-board/ui',
  },
});

const setupBullBoard = (app: Elysia) =>
  app
    // Secure the Bull dashboard with admin middleware
    // .use(authPlugin)
    .use(serverAdapter.registerPlugin());

export default setupBullBoard;
