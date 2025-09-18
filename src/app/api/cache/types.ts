import { UnifiedSearchResponse } from "../types/unifiedSearchResponse";

export interface UserMessage {
  role: "user";
  messageId: string;
  prompt: string;
  timestamp: string;
}

export interface AssistantMessage {
  role: "assistant";
  messageId: string;
  searchResponse?: UnifiedSearchResponse;
  c1Response?: string;
  timestamp: string;
}

export type ThreadMessage = UserMessage | AssistantMessage;
