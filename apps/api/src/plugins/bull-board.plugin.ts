import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import type Elysia from "elysia";
// import { authPlugin } from "~/features/auth/auth.plugin";
import { auditLogQueue } from "~/features/misc/audits/audit.queue";

const serverAdapter = new ElysiaAdapter("/api/v1/queues");

const queues = [new BullMQAdapter(auditLogQueue)];

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
