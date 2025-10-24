class AIConversationMemory {
  private readonly conversations = new Map<
    string,
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >();

  addMessage(threadId: string, role: "user" | "assistant", content: string) {
    if (!this.conversations.has(threadId)) {
      this.conversations.set(threadId, []);
    }

    const conversation = this.conversations.get(threadId) || [];
    conversation.push({ role, content, timestamp: new Date() });

    // Keep only last 50 messages to prevent memory bloat
    if (conversation.length > 50) {
      conversation.splice(0, conversation.length - 50);
    }
  }

  getConversation(threadId: string) {
    return this.conversations.get(threadId) || [];
  }

  clearConversation(threadId: string) {
    this.conversations.delete(threadId);
  }

  getContextualPrompt(threadId: string, newQuery: string): string {
    const history = this.getConversation(threadId)
      .slice(-10) // Last 10 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    return history
      ? `Context:\n${history}\n\nNew query: ${newQuery}`
      : newQuery;
  }
}

export const conversationMemory = new AIConversationMemory();
