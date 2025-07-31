import { googleImageSearch } from "../services/googleSearch";

export const searchImage = async (query: string) => {
  try {
    const response = await googleImageSearch({
      query,
      num: 1,
    });

    if (!response.items || response.items.length === 0) {
      return { altText: query, imageUrl: null, thumbnailUrl: null };
    }

    return {
      url: response.items[0]?.link ?? "",
      thumbnailUrl: response.items[0]?.image?.thumbnailLink ?? "",
    };
  } catch (error) {
    return {
      url: "https://via.placeholder.com/360x240",
      thumbnailUrl: "https://via.placeholder.com/360x240",
    };
  }
};
