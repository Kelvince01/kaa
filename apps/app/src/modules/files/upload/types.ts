import { z } from "zod";

export const attachmentSchema = z.object({
  url: z.string(),
  id: z.string(),
  name: z.string(),
  filename: z.string(),
  contentType: z.string(),
});

export type Attachment = z.infer<typeof attachmentSchema>;
