import { Elysia } from "elysia";
import { messageWSController } from "./features/comms/messages/message-ws.controller";
import { notificationWSController } from "./features/comms/notifications/notification-ws.controller";
import { videoCallingWSController } from "./features/comms/video-calling/video-calling-ws.controller";
import { collaborationWebSocketController } from "./features/virtual-tours/collaboration-ws.controller";
import { baseWsController } from "./features/ws";

const wsRoutes = new Elysia()
  .use(videoCallingWSController)
  .use(baseWsController)
  .use(collaborationWebSocketController)
  .use(messageWSController)
  .use(notificationWSController);

export { wsRoutes as WSRoutes };
