import { mistral } from "@ai-sdk/mistral";
import { embed, embedMany } from "ai";

export class Embed {
  async embedMany(content: string[]) {
    const { embeddings } = await embedMany({
      model: mistral.textEmbeddingModel("mistral-embed"),
      values: content,
    });

    return embeddings;
  }

  async embed(content: string) {
    const { embedding } = await embed({
      model: mistral.textEmbeddingModel("mistral-embed"),
      value: content,
    });

    return embedding;
  }
}
