/**
 * Validates whether a given string is a correct C1 response
 *
 * @param response - The response string to validate
 * @returns true if the response is valid, false otherwise
 *
 * Valid conditions:
 * - Must contain non-empty content between <content> and </content> tags
 *
 * Invalid conditions:
 * - Missing <content> tags
 * - Empty content between <content> tags
 * - Only contains <thinkitem> tags without meaningful content
 */
export function isValidC1Response(response: string): boolean {
  if (!response || typeof response !== "string") {
    return false;
  }

  // Check if content tags exist
  const contentTagRegex = /<content>([\s\S]*?)<\/content>/;
  const contentMatch = response.match(contentTagRegex);

  if (!contentMatch) {
    return false;
  }

  // Extract content between tags
  const content = contentMatch[1];

  // Check if content is empty or only whitespace
  if (!content || content.trim() === "") {
    return false;
  }

  // Remove thinkitem tags and their content to check if there's meaningful content
  const contentWithoutThinkItems = content
    .replace(/<thinkitem[^>]*>[\s\S]*?<\/thinkitem>/g, "")
    .trim();

  // If after removing thinkitem tags there's no meaningful content, it's invalid
  if (contentWithoutThinkItems === "") {
    return false;
  }

  return true;
}
