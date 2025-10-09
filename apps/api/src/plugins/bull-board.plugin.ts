import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { emailQueue, smsQueue } from "@kaa/services/queues";
import type Elysia from "elysia";
import { authBackgroundQueue } from "~/features/auth/services/auth-background.service";
// import { authPlugin } from "~/features/auth/auth.plugin";
import { auditLogQueue } from "~/features/misc/audits/audit.queue";

const serverAdapter = new ElysiaAdapter("/api/v1/queues");

const queues = [
  new BullMQAdapter(auditLogQueue),
  new BullMQAdapter(authBackgroundQueue),
  new BullMQAdapter(smsQueue),
  new BullMQAdapter(emailQueue),
];

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
