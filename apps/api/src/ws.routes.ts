import { Elysia } from "elysia";

import { videoCallingWSController } from "./features/comms/video-calling/video-calling-ws.controller";
import { websocketController } from "./features/comms/websocket.controller";
import { collaborationWebSocketController } from "./features/virtual-tours/collaboration-ws.controller";
import { baseWsController } from "./features/ws";

const wsRoutes = new Elysia()
  .use(videoCallingWSController)
  .use(baseWsController)
  .use(collaborationWebSocketController)
  .use(websocketController);

export { wsRoutes as WSRoutes };
