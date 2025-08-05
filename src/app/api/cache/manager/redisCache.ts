import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

import { AssistantMessage, ThreadMessage, UserMessage } from "../types";

import { ICacheManager } from "./interface";

const THREAD_TTL_SECONDS = 3600; // 1 hour

export class RedisCacheManager implements ICacheManager {
  private redis: Redis;

  constructor() {
    this.redis = Redis.fromEnv();
  }

  getThread = async (threadId: string): Promise<ThreadMessage[] | null> => {
    try {
      return await this.redis.get<ThreadMessage[]>(threadId);
    } catch (error) {
      console.error("Error getting thread from cache:", error);
      return null;
    }
  };

  private saveThread = async (
    threadId: string,
    thread: ThreadMessage[],
  ): Promise<void> => {
    try {
      await this.redis.set(threadId, thread, { ex: THREAD_TTL_SECONDS });
    } catch (error) {
      console.error("Error saving thread to cache:", error);
    }
  };

  addUserMessage = async (
    threadId: string,
    prompt: string,
  ): Promise<UserMessage> => {
    const thread = (await this.getThread(threadId)) || [];
    const userMessage: UserMessage = {
      role: "user",
      messageId: uuidv4(),
      prompt,
      timestamp: new Date().toISOString(),
    };
    const updatedThread = [...thread, userMessage];
    await this.saveThread(threadId, updatedThread);
    return userMessage;
  };

  addAssistantMessage = async (
    threadId: string,
    initialData?: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<AssistantMessage> => {
    const thread = (await this.getThread(threadId)) || [];
    const assistantMessage: AssistantMessage = {
      role: "assistant",
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      ...initialData,
    };
    const updatedThread = [...thread, assistantMessage];
    await this.saveThread(threadId, updatedThread);
    return assistantMessage;
  };

  updateAssistantMessage = async (
    threadId: string,
    messageId: string,
    updates: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<void> => {
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
  };
}
