import { getCacheManager } from "./manager";

export * from "./types";

const cacheManager = getCacheManager();

export const {
  getThread,
  addUserMessage,
  addAssistantMessage,
  updateAssistantMessage,
} = cacheManager;
