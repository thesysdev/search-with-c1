export const addCitations = (response: any) => {
  let text = response.text;
  const supports =
    response.candidates?.[0]?.groundingMetadata?.groundingSupports;
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  const sortedSupports = [...(supports ?? [])].sort(
    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
  );

  for (const support of sortedSupports) {
    const endIndex = support.segment?.endIndex;
    if (endIndex === undefined || !support.groundingChunkIndices?.length) {
      continue;
    }

    const citationLinks = support.groundingChunkIndices
      .map((i: number) => {
        const uri = chunks?.[i]?.web?.uri;
        if (uri) {
          return `[${i + 1}](${uri})`;
        }
        return null;
      })
      .filter(Boolean);

    if (citationLinks.length > 0) {
      const citationString = citationLinks.join(", ");
      text = text?.slice(0, endIndex) + citationString + text?.slice(endIndex);
    }
  }

  return text;
};
