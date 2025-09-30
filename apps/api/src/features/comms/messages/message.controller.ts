import { messageService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { authPlugin } from "../../auth/auth.plugin";
import { messageListQuerySchema } from "./message.schema";

export const messageController = new Elysia({ prefix: "/messages" })
  .use(authPlugin)
  .get(
    "/:conversationId",
    async ({ query, user, params }) => {
      const result = await messageService.getMessages(
        params.conversationId,
        query,
        user.id
      );
      return result;
    },
    {
      params: t.Object({
        conversationId: t.String(),
      }),
      query: messageListQuerySchema,
    }
  );
