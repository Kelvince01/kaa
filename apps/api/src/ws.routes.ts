import { Elysia } from "elysia";

import { videoCallingWSController } from "./features/comms/video-calling/video-calling-ws.controller";
import { collaborationWebSocketController } from "./features/virtual-tours/collaboration-ws.controller";
import { baseWsController } from "./features/ws";

const routes = new Elysia()
  .use(videoCallingWSController)
  .use(baseWsController)
  .use(collaborationWebSocketController);

export { routes as WSRoutes };
