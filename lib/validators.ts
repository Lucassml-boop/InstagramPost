import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const generatePostSchema = z.object({
  topic: z.string().min(2),
  message: z.string().min(2),
  tone: z.enum(["professional", "casual", "promotional"]),
  outputLanguage: z.enum(["en", "pt-BR"]).default("en"),
  customInstructions: z.string().optional().default(""),
  brandColors: z.string().min(2),
  keywords: z.string().optional().default("")
});

export const generationSettingsSchema = z.object({
  outputLanguage: z.enum(["en", "pt-BR"]).default("en"),
  customInstructions: z.string().optional().default("")
});

export const publishPostSchema = z.object({
  postId: z.string().min(1),
  caption: z.string().min(1),
  imageUrl: z.string().min(1).optional(),
  imagePath: z.string().min(1).optional()
});

export const schedulePostSchema = publishPostSchema.extend({
  scheduledTime: z.string().datetime()
});
