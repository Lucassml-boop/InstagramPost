import { z } from "zod";

export const postTypeSchema = z.enum(["feed", "story", "carousel"]);

export const postMediaItemSchema = z.object({
  imageUrl: z.string().min(1),
  imagePath: z.string().min(1),
  previewUrl: z.string().min(1).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8)
});

export const generatePostSchema = z.object({
  topic: z.string().min(2),
  message: z.string().min(2),
  tone: z.enum(["professional", "casual", "promotional"]),
  postType: postTypeSchema.default("feed"),
  carouselSlideCount: z.number().int().min(2).max(10).default(3),
  carouselSlideContexts: z.array(z.string()).max(10).optional().default([]),
  outputLanguage: z.enum(["en", "pt-BR"]).default("en"),
  customInstructions: z.string().optional().default(""),
  brandColors: z.string().min(2),
  keywords: z.string().optional().default(""),
  allowSimilarPost: z.boolean().optional().default(false)
});

export const generationSettingsSchema = z.object({
  outputLanguage: z.enum(["en", "pt-BR"]).default("en"),
  customInstructions: z.string().optional().default("")
});

export const publishPostSchema = z.object({
  postId: z.string().min(1),
  caption: z.string().default(""),
  postType: postTypeSchema.optional(),
  mediaItems: z.array(postMediaItemSchema).min(1).max(10).optional(),
  imageUrl: z.string().min(1).optional(),
  imagePath: z.string().min(1).optional()
});

export const schedulePostSchema = publishPostSchema.extend({
  scheduledTime: z.string().datetime()
});

export const deletePostsSchema = z.object({
  postIds: z.array(z.string().min(1)).min(1).max(100)
});
