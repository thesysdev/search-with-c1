import { NextRequest } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { transformStream } from "@crayonai/stream";
import { tools } from "./tools";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

export async function POST(req: NextRequest) {
  const { prompt, previousC1Response } = (await req.json()) as {
    prompt: string;
    previousC1Response?: string;
  };

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

  const responseStream = new TransformStream<string, string>();
  const responseWriter = responseStream.writable.getWriter();

  const t = tools((progress) => {
    responseWriter.write(`<progress>${JSON.stringify(progress)}</progress>`);
  });

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1-nightly",
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

Remember to be helpful, accurate, and comprehensive in your responses while maintaining a conversational tone.`,
      },
      ...messages,
    ],
    stream: true,
    tool_choice: "auto",
    tools: t,
  });

  const llmStream = await runToolsResponse;

  runToolsResponse.on("message", (m) => {
    console.log(m);
  });

  transformStream(
    llmStream,
    (chunk) => {
      const contentDelta = chunk.choices[0]?.delta?.content || "";

      console.log(contentDelta);
      if (contentDelta) {
        responseWriter.write(contentDelta);
      }
      return contentDelta;
    },
    {
      onEnd: () => {
        responseWriter.close();
      },
    }
  );

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
