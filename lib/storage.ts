export function isRemoteAssetUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function isRemoteAssetPath(value: string) {
  return value.startsWith("supabase://") || isRemoteAssetUrl(value);
}

type AssetTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

function buildSupabaseTransformedUrl(publicUrl: string, options: AssetTransformOptions) {
  try {
    const url = new URL(publicUrl);

    if (!url.pathname.startsWith("/storage/v1/object/public/")) {
      return null;
    }

    url.pathname = url.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );

    if (options.width) {
      url.searchParams.set("width", String(options.width));
    }

    if (options.height) {
      url.searchParams.set("height", String(options.height));
    }

    if (options.quality) {
      url.searchParams.set("quality", String(options.quality));
    }

    if (options.resize) {
      url.searchParams.set("resize", options.resize);
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function getOptimizedAssetUrl(publicUrl: string, options: AssetTransformOptions = {}) {
  if (!publicUrl) {
    return publicUrl;
  }

  return buildSupabaseTransformedUrl(publicUrl, options) ?? publicUrl;
}

export function getPersistedPreviewUrl(publicUrl: string) {
  return getOptimizedAssetUrl(publicUrl, {
    width: 320,
    height: 320,
    quality: 72,
    resize: "cover"
  });
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
