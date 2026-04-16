import { z } from "zod";

export const contentPlanItemSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  goal: z.string().min(1),
  type: z.string().min(1),
  format: z.string().min(1),
  theme: z.string().min(1),
  structure: z.union([
    z.array(z.string().min(1)).min(3),
    z.string().min(1).transform((str) => str.split(" | ").map((s) => s.trim()).filter(Boolean))
  ]),
  caption: z.string().min(1),
  visualIdea: z.string().min(1),
  cta: z.string().min(1),
  topicKeywords: z.union([
    z.array(z.string().min(1)).min(1),
    z.string().min(1).transform((str) => str.split(",").map((s) => s.trim()).filter(Boolean))
  ])
});

export function createWeeklyAgendaSchema(expectedCount: number) {
  return z.array(contentPlanItemSchema).length(expectedCount);
}

export const brandProfileSchema = z.object({
  brandName: z.string().min(1),
  editableBrief: z.string().min(1),
  automationLoopEnabled: z.boolean().default(true),
  topicsHistoryCleanupFrequency: z
    .enum(["disabled", "daily", "weekly", "monthly"])
    .default("monthly"),
  services: z.array(z.string().min(1)).min(1),
  weeklyAgenda: z.record(
    z.object({
      enabled: z.boolean().default(true),
      goal: z.string().default(""),
      contentTypes: z.array(z.string().min(1)).default([]),
      formats: z.array(z.string().min(1)).default([]),
      postsPerDay: z.number().int().min(1).max(10).default(1),
      postTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).default(["09:00"]),
      postIdeas: z
        .array(
          z.object({
            goal: z.string().default(""),
            contentTypes: z.array(z.string().min(1)).default([]),
            formats: z.array(z.string().min(1)).default([]),
            confirmed: z.boolean().default(true)
          })
        )
        .default([])
    })
  ),
  carouselDefaultStructure: z.array(z.string().min(1)).min(1),
  contentRules: z.array(z.string().min(1)).min(1),
  researchQueries: z.array(z.string().min(1)).min(1),
  goalPresets: z.array(z.string().min(1)).default([]),
  contentTypePresets: z.array(z.string().min(1)).default([]),
  formatPresets: z.array(z.string().min(1)).default([]),
  generationRigor: z.enum(["strict", "balanced", "flexible"]).default("balanced"),
  historyLookbackDays: z.number().int().min(1).max(365).default(60)
});

export const historyItemSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  theme: z.string().min(1)
});

export const automaticPostIdeaSchema = z.object({
  goal: z.string().min(20),
  contentTypes: z.array(z.string().min(8)).min(3).max(6),
  formats: z.array(z.string().min(5)).min(3).max(5)
});

export const automaticSettingTargetSchema = z.enum([
  "brandName",
  "editableBrief",
  "services",
  "contentRules",
  "researchQueries",
  "carouselDefaultStructure",
  "goalPresets",
  "contentTypePresets",
  "formatPresets",
  "customInstructions"
]);

export const automaticSettingSchema = z.object({
  value: z.string().min(1)
});

export const automaticSettingsBundleSchema = z.object({
  brandName: z.string().min(1),
  editableBrief: z.string().min(1),
  services: z.string().min(1),
  contentRules: z.string().min(1),
  researchQueries: z.string().min(1),
  carouselDefaultStructure: z.string().min(1),
  goalPresets: z.string().min(1),
  contentTypePresets: z.string().min(1),
  formatPresets: z.string().min(1),
  customInstructions: z.string().min(1)
});

export const automaticCreatePostInputsSchema = z.object({
  topic: z.string().min(2),
  message: z.string().min(2),
  keywords: z.string(),
  brandColors: z.string().min(2),
  carouselSlideContexts: z.array(z.string()).max(10)
});

export type ContentPlanItem = z.infer<typeof contentPlanItemSchema>;
export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type HistoryItem = z.infer<typeof historyItemSchema>;
export type AutomaticPostIdea = z.infer<typeof automaticPostIdeaSchema>;
export type AutomaticSettingTarget = z.infer<typeof automaticSettingTargetSchema>;
