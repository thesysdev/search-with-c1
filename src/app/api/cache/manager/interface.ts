import { AssistantMessage, UserMessage, ThreadMessage } from "../types";

/**
 * Defines the interface for a cache manager.
 * A cache manager is responsible for storing and retrieving thread history.
 */
export interface ICacheManager {
  /**
   * Retrieves a thread from the cache.
   * @param threadId The ID of the thread to retrieve.
   * @returns A promise that resolves to an array of thread messages, or null if the thread is not found.
   */
  getThread(threadId: string): Promise<ThreadMessage[] | null>;

  /**
   * Adds a user message to a thread.
   * @param threadId The ID of the thread to add the message to.
   * @param prompt The prompt from the user.
   * @returns A promise that resolves to the newly created user message.
   */
  addUserMessage(threadId: string, prompt: string): Promise<UserMessage>;

  /**
   * Adds an assistant message to a thread.
   * @param threadId The ID of the thread to add the message to.
   * @param initialData Optional data to include in the assistant message.
   * @returns A promise that resolves to the newly created assistant message.
   */
  addAssistantMessage(
    threadId: string,
    initialData?: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<AssistantMessage>;

  /**
   * Updates an assistant message in a thread.
   * @param threadId The ID of the thread containing the message.
   * @param messageId The ID of the message to update.
   * @param updates An object containing the updates to apply to the message.
   * @returns A promise that resolves when the message has been updated.
   */
  updateAssistantMessage(
    threadId: string,
    messageId: string,
    updates: Partial<
      Omit<AssistantMessage, "role" | "messageId" | "timestamp">
    >,
  ): Promise<void>;
}
