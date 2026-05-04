import { z } from "zod";
import { topicHistoryRecordSchema } from "./content-system.schemas.ts";
import { normalizeTopicHistoryRecord } from "./content-system-utils.ts";

export function parseTopicHistoryRecords(raw: unknown) {
  return z
    .array(z.union([z.string(), topicHistoryRecordSchema.partial()]))
    .parse(raw)
    .map((entry) => normalizeTopicHistoryRecord(entry))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}
