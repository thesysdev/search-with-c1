import {
  ThreadMessage,
  UserMessage,
  AssistantMessage,
} from "../../cache/threadCache";

/**
 * Finds a cached turn in the thread history based on the user's prompt.
 * A "turn" consists of a user message and the corresponding assistant message.
 * @param prompt The user's prompt to search for.
 * @param history The thread history to search within.
 * @returns An object containing the user and assistant messages if a cached turn is found, otherwise undefined.
 */
export const findCachedTurn = (
  prompt: string,
  history: ThreadMessage[],
): { user: UserMessage; assistant: AssistantMessage } | undefined => {
  for (let i = 0; i < history.length - 1; i++) {
    const userMsg = history[i];
    if (
      userMsg.role === "user" &&
      userMsg.prompt === prompt &&
      i + 1 < history.length
    ) {
      const assistantMsg = history[i + 1];
      if (assistantMsg.role === "assistant") {
        return {
          user: userMsg as UserMessage,
          assistant: assistantMsg as AssistantMessage,
        };
      }
    }
  }
  return undefined;
};
