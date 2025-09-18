/**
 * Enum for different search providers
 */
export enum SearchProvider {
  GEMINI = "gemini",
  EXA = "exa",
}

/**
 * Configuration for search providers
 */
export interface SearchProviderConfig {
  provider: SearchProvider;
  numResults?: number;
}
