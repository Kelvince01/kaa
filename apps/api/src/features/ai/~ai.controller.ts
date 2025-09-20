import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import { Elysia, t } from "elysia";

export const aiController = new Elysia().group("/ai", (app) =>
  app.post(
    "/chat",
    async ({ body }) => {
      const uiMessages = body.messages || [];
      console.log(uiMessages);

      const result = await streamText({
        model: google("gemini-2.0-flash"),
        messages: convertToModelMessages(uiMessages as any),
      });

      return result.toUIMessageStreamResponse();
    },
    {
      body: t.Object({
        messages: t.Array(t.String()),
      }),
    }
  )
);
