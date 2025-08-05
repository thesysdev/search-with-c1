import { v4 as uuidv4 } from "uuid";

import { AssistantMessage, ThreadMessage, UserMessage } from "../types";

import { ICacheManager } from "./interface";

export class NoOpCacheManager implements ICacheManager {
  async getThread(_threadId: string): Promise<ThreadMessage[] | null> {
    console.log(
      "No-op cache manager in use. Thread history will not be preserved.",
    );
    return Promise.resolve(null);
  }

  async addUserMessage(
    _threadId: string,
    prompt: string,
  ): Promise<UserMessage> {
    return Promise.resolve({
      role: "user",
      messageId: uuidv4(),
      prompt,
      timestamp: new Date().toISOString(),
    });
  }

  async addAssistantMessage(
    _threadId: string,
    initialData?: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<AssistantMessage> {
    return Promise.resolve({
      role: "assistant",
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      ...initialData,
    });
  }

  async updateAssistantMessage(
    _threadId: string,
    _messageId: string,
    _updates: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<void> {
    return Promise.resolve();
  }
}
