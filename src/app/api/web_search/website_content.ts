import { Readability } from '@mozilla/readability';
import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Fetches content from a single URL and extracts the main text content
 * @param url The URL to fetch content from
 * @returns The extracted text content or null if extraction failed
 */
async function fetchAndExtractContent(url: string): Promise<{
  content: string | null;
}> {
  try {
    const axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    });

    const res = await axiosInstance.get(url);
    const html = res.data;
    const dom = new JSDOM(html as string, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    return { content: article?.textContent || null };
  } catch (err: Error | unknown) {
    console.error(`Failed to fetch or parse ${url}: ${(err as Error).message}`);
    return { content: null };
  }
}

/**
 * Extracts content from multiple websites
 * @param urls List of URLs to extract content from
 * @returns Array of results containing URLs and their extracted content
 */
export async function extractWebsiteContent(urls: string[]): Promise<{
  results: Array<{ url: string; content: string | null }>;
}> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const { content } = await fetchAndExtractContent(url);
      return { url, content };
    })
  );

  return { results };
}
