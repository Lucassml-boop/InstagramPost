const DEFAULT_STORAGE_BUCKET = "instagram-post-media";

export const AI_DIGITAL_SOURCE_TYPE =
  "https://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia";
export const GENERATED_POSTS_DIR = "generated-posts";
export const UPLOADS_DIR = "uploads";

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

export function getSupabaseStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl: normalizeSupabaseUrl(supabaseUrl),
    serviceRoleKey,
    bucket
  };
}
