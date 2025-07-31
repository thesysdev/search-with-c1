"use server";

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { transformStream } from "@crayonai/stream";
import { getTools } from "../tools";
import { makeC1Response } from "@thesysai/genui-sdk/server";

const client = new OpenAI({
  baseURL: "https://api.dev.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

/**
 * API route handler for ask endpoint
 * @param req The NextRequest object
 * @returns A streaming response
 */
export async function POST(req: NextRequest) {
  const c1Response = makeC1Response();
  const { prompt, previousC1Response } = (await req.json()) as {
    prompt: string;
    previousC1Response?: string;
  };

  c1Response.writeThinkItem({
    title: "Thinking...",
    description: "Diving into the digital depths to craft you an answer",
  });

  const messages: ChatCompletionMessageParam[] = [];

  if (previousC1Response) {
    messages.push({
      role: "assistant",
      content: previousC1Response,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const tools = getTools((progress) => {
    c1Response.writeThinkItem({
      title: progress.title,
      description: progress.content,
    });
  });

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-3.5-sonnet/v-20250617",
    messages: [
      {
        role: "system",
        content: `You can:
- Search and retrieve real-time information from the web
- Answer questions on any topic with up-to-date information
- Summarize articles and web content
- Provide detailed research and analysis
- Explain complex topics in simple terms
- Find latest news, trends, and developments

Today is ${new Date().toLocaleDateString()}.

For each response:
1. Search for relevant and current information from multiple sources and compile them
2. Present information in a clear, organized manner using best ui components
3. Cite sources when providing information with links and source thumnails images with links
4. Try to include images to make the response more engaging using the image tool
5. When using the image tool then try to fetch multiple images and use the IMAGE_GALLERY component
5. Use graphs for showing any data visualizations of any kind (e.g. charts, tables, etc.)

Remember to be helpful, accurate, and comprehensive in your responses while maintaining a conversational tone.
<interactive_guidelines>
- Do NOT generate components for actions that cannot be executed (booking, downloading, payments)
</interactive_guidelines>

<followup_guidelines>
- ALWAYS include FollowUpBlock with 2-4 relevant follow-up questions if the user's question is not a simple one-off question.
- Questions should be written in active voice as potential user prompts (e.g., "Tell me more about X" rather than "Do you want to know more about X?")
- Questions should naturally extend from the current conversation
</followup_guidelines>

<image_guidelines>
When responding to queries, automatically include relevant images according to these rules:
1. Always keep src field empty for images, imagesSrc field empty for image gallery components and imageSrc in listblock component empty.
2. **Image Search Queries:**
- When using the 'image_search' tool, generate queries that are descriptive but concise.
- Instead of a single, overly-detailed query, provide multiple shorter queries to cover different aspects of the subject. This helps in fetching a diverse set of relevant images.
- For example, if searching for images of "Toit Brewpub," good queries would be ["Toit Brewpub, Bangalore", "Toit food", "Toit interior"]. 
- Avoid creating hyper-specific queries like "Toit Brewpub interior with brewing tanks and wooden decor in Indiranagar, Bangalore".

3. ALWAYS try to include images for:
   - Physical places (landmarks, tourist attractions, cities, natural wonders)
   - Tangible items (foods, products, animals, plants, vehicles)
   - Visual concepts (art, designs, architecture, fashion)
   - People or characters (historical figures, celebrities, fictional characters)
4. NEVER include images for:
   - Thesys related content
   - Abstract concepts (ideas, theories, emotions)
   - Simple greetings or acknowledgments
   - Technical discussions without visual components
   - Mathematical or logical explanations
   - Step-by-step instructions that don't benefit from visual aids
5. Use ImageGallery component to display multiple related images in a grid layout.
6. When using ListBlock/ListItem component, that have strong visual components (e.g., tourist attractions, foods, products), ALWAYS include an image for each item.
7. Balance visual content with textual information - images should enhance understanding, not replace substantive content.
</image_guidelines>
`,
      },
      ...messages,
    ],
    stream: true,
    tool_choice: "auto",
    parallel_tool_calls: true,
    tools,
  });

  const llmStream = await runToolsResponse;

  transformStream(
    llmStream,
    (chunk) => {
      const contentDelta = chunk.choices[0]?.delta?.content || "";

      if (contentDelta) {
        c1Response.writeContent(contentDelta);
      }
      return contentDelta;
    },
    {
      onEnd: () => {
        try {
          c1Response.end();
        } catch (error) {
          console.error("Stream already closed:", error);
        }
      },
    },
  );

  return new Response(c1Response.responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
