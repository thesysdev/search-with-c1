export interface UserMessage {
  role: "user";
  messageId: string;
  prompt: string;
  timestamp: string;
}

export interface AssistantMessage {
  role: "assistant";
  messageId: string;
  searchResponse?: any;
  c1Response?: string;
  timestamp: string;
}

export type ThreadMessage = UserMessage | AssistantMessage;
