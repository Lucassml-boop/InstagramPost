import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { requireEnv } from "@/lib/env";

const GeneratedPostSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()).min(4).max(12),
  html: z.string(),
  css: z.string()
});

export type GeneratedPostContent = z.infer<typeof GeneratedPostSchema>;

let cachedClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: requireEnv("OPENAI_API_KEY")
    });
  }

  return cachedClient;
}

export async function generateInstagramPost(input: {
  topic: string;
  message: string;
  tone: string;
  brandColors: string;
  keywords?: string;
}) {
  const client = getOpenAIClient();

  const response = await client.responses.parse({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You create Instagram marketing assets. Return only structured content. Create a concise caption, a relevant hashtag list, and a polished square post layout. The HTML must be body-only markup with semantic divs, no scripts, no remote assets, no SVG, no canvas, and no external fonts. The CSS must fully style a 1080x1080 social post using strong hierarchy and a clean premium look."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Topic: ${input.topic}`,
              `Promotion or message: ${input.message}`,
              `Tone: ${input.tone}`,
              `Brand colors: ${input.brandColors}`,
              `Optional keywords: ${input.keywords || "None"}`,
              "Design requirements: create a striking 1080x1080 Instagram promo card with title, supporting copy, CTA, background treatment, and decorative shapes. Keep all content inside a square-safe area. Avoid placeholders like lorem ipsum."
            ].join("\n")
          }
        ]
      }
    ],
    text: {
      format: zodTextFormat(GeneratedPostSchema, "generated_instagram_post")
    }
  });

  return response.output_parsed;
}
