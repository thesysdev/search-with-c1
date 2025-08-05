import { randomUUID } from "crypto";

import { Redis } from "@upstash/redis";

import { AssistantMessage, ThreadMessage, UserMessage } from "../types";

import { ICacheManager } from "./interface";

const THREAD_TTL_SECONDS = 3600; // 1 hour

export class RedisCacheManager implements ICacheManager {
  private redis: Redis;

  constructor() {
    this.redis = Redis.fromEnv();
  }

  async getThread(threadId: string): Promise<ThreadMessage[] | null> {
    try {
      return await this.redis.get<ThreadMessage[]>(threadId);
    } catch (error) {
      console.error("Error getting thread from cache:", error);
      return null;
    }
  }

  private async saveThread(
    threadId: string,
    thread: ThreadMessage[],
  ): Promise<void> {
    try {
      await this.redis.set(threadId, thread, { ex: THREAD_TTL_SECONDS });
    } catch (error) {
      console.error("Error saving thread to cache:", error);
    }
  }

  async addUserMessage(threadId: string, prompt: string): Promise<UserMessage> {
    const thread = (await this.getThread(threadId)) || [];
    const userMessage: UserMessage = {
      role: "user",
      messageId: randomUUID(),
      prompt,
      timestamp: new Date().toISOString(),
    };
    const updatedThread = [...thread, userMessage];
    await this.saveThread(threadId, updatedThread);
    return userMessage;
  }

  async addAssistantMessage(
    threadId: string,
    initialData?: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<AssistantMessage> {
    const thread = (await this.getThread(threadId)) || [];
    const assistantMessage: AssistantMessage = {
      role: "assistant",
      messageId: randomUUID(),
      timestamp: new Date().toISOString(),
      ...initialData,
    };
    const updatedThread = [...thread, assistantMessage];
    await this.saveThread(threadId, updatedThread);
    return assistantMessage;
  }

  async updateAssistantMessage(
    threadId: string,
    messageId: string,
    updates: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<void> {
    const thread = await this.getThread(threadId);
    if (!thread) {
      return;
    }

    const messageIndex = thread.findIndex(
      (msg) => msg.messageId === messageId && msg.role === "assistant",
    );

    if (messageIndex === -1) {
      return;
    }

    const updatedMessage = { ...thread[messageIndex], ...updates };
    thread[messageIndex] = updatedMessage;

    await this.saveThread(threadId, thread);
  }
}
