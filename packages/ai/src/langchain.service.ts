export type LangChainRequest = {
  prompt: string;
  context?: string[];
  memberId: string;
  userId: string;
  type: "chat" | "completion" | "summarization" | "analysis";
};

export class LangChainService {
  // constructor() {}
}

export const langChainService = new LangChainService();
