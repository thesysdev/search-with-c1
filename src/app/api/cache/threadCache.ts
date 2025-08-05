import { Redis } from "@upstash/redis";
import { randomUUID } from "crypto";

const redis = Redis.fromEnv();

const THREAD_TTL_SECONDS = 3600; // 1 hour

export interface UserMessage {
  role: "user";
  messageId: string; // generate this on the backend only
  prompt: string;
  timestamp: string;
}

export interface AssistantMessage {
  role: "assistant";
  messageId: string; // generate this on the backend only
  searchResponse?: any;
  c1Response?: string;
  timestamp: string;
}

export type ThreadMessage = UserMessage | AssistantMessage;

export const getThread = async (
  threadId: string,
): Promise<ThreadMessage[] | null> => {
  try {
    const thread = await redis.get<ThreadMessage[]>(threadId);
    if (thread) {
      console.log("🚀 ~ thread Cache HIT", threadId);
    } else {
      console.log("🚀 ~ thread Cache MISS", threadId);
    }
    return thread;
  } catch (error) {
    console.error("Error getting thread from cache:", error);
    return null;
  }
};

const saveThread = async (
  threadId: string,
  thread: ThreadMessage[],
): Promise<void> => {
  try {
    await redis.set(threadId, thread, { ex: THREAD_TTL_SECONDS });
  } catch (error) {
    console.error("Error saving thread to cache:", error);
  }
};

export const addUserMessage = async (
  threadId: string,
  prompt: string,
): Promise<UserMessage> => {
  const thread = (await getThread(threadId)) || [];
  const userMessage: UserMessage = {
    role: "user",
    messageId: randomUUID(),
    prompt,
    timestamp: new Date().toISOString(),
  };
  const updatedThread = [...thread, userMessage];
  await saveThread(threadId, updatedThread);
  return userMessage;
};

export const addAssistantMessage = async (
  threadId: string,
  initialData?: Partial<
    Omit<AssistantMessage, "role" | "messageId" | "timestamp">
  >,
): Promise<AssistantMessage> => {
  const thread = (await getThread(threadId)) || [];
  const assistantMessage: AssistantMessage = {
    role: "assistant",
    messageId: randomUUID(),
    timestamp: new Date().toISOString(),
    ...initialData,
  };
  const updatedThread = [...thread, assistantMessage];
  await saveThread(threadId, updatedThread);
  return assistantMessage;
};

export const updateAssistantMessage = async (
  threadId: string,
  messageId: string,
  updates: Partial<Omit<AssistantMessage, "role" | "messageId" | "timestamp">>,
) => {
  const thread = await getThread(threadId);
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

  await saveThread(threadId, thread);
};
