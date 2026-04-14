import { saveGeneratedImageBuffer } from "@/lib/storage.server";

const RENDER_TIMEOUT_MS = 120_000;

async function launchLocalPuppeteerBrowser() {
  const { default: puppeteer } = await import("puppeteer");
  const executablePath = puppeteer.executablePath();

  console.info("[renderer] Launching local Puppeteer browser", {
    executablePath,
    platform: process.platform
  });

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: process.platform === "linux" ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
  });
}

async function launchRendererBrowser() {
  const shouldTryBundledChromium = process.platform === "linux" || process.env.VERCEL === "1";

  if (!shouldTryBundledChromium) {
    console.info("[renderer] Skipping bundled Chromium on this platform", {
      platform: process.platform,
      vercel: process.env.VERCEL ?? null
    });
    return launchLocalPuppeteerBrowser();
  }

  try {
    const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
      import("@sparticuz/chromium"),
      import("puppeteer-core")
    ]);

    const executablePath = await chromium.executablePath();

    console.info("[renderer] Launching bundled Chromium", {
      executablePath,
      platform: process.platform,
      vercel: process.env.VERCEL ?? null
    });

    return await puppeteer.launch({
      executablePath,
      args: chromium.args,
      headless: true
    });
  } catch (error) {
    console.warn("[renderer] Falling back to local Puppeteer browser", {
      error: error instanceof Error ? error.message : String(error),
      vercel: process.env.VERCEL ?? null,
      platform: process.platform
    });
  }

  return launchLocalPuppeteerBrowser();
}

function buildHtmlDocument(html: string, css: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #ffffff;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .frame {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      ${css}
    </style>
  </head>
  <body>
    <div class="frame">${html}</div>
  </body>
</html>`;
}

export async function renderPostImage(input: {
  slug: string;
  html: string;
  css: string;
  width: number;
  height: number;
}) {
  const startedAt = Date.now();
  console.info("[renderer] Starting image render", {
    slug: input.slug,
    width: input.width,
    height: input.height,
    htmlLength: input.html.length,
    cssLength: input.css.length
  });

  const browser = await launchRendererBrowser();

  try {
    console.info("[renderer] Browser launched", {
      slug: input.slug,
      durationMs: Date.now() - startedAt
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(RENDER_TIMEOUT_MS);
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);

    page.on("pageerror", (error) => {
      console.error("[renderer] Page error", {
        slug: input.slug,
        message: error instanceof Error ? error.message : String(error)
      });
    });

    page.on("requestfailed", (request) => {
      console.warn("[renderer] Request failed", {
        slug: input.slug,
        url: request.url(),
        errorText: request.failure()?.errorText ?? "unknown"
      });
    });

    await page.setViewport({ width: input.width, height: input.height, deviceScaleFactor: 1 });
    await page.setContent(buildHtmlDocument(input.html, input.css), {
      waitUntil: "domcontentloaded",
      timeout: RENDER_TIMEOUT_MS
    });

    // The generated layout is self-contained, so a short settle delay is enough
    // and avoids waiting forever for "networkidle" when the page never becomes idle.
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.info("[renderer] Content rendered in page", {
      slug: input.slug,
      durationMs: Date.now() - startedAt
    });

    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 90
    });

    const savedImage = await saveGeneratedImageBuffer({
      bytes: Buffer.from(buffer),
      slug: input.slug,
      markAsAiGenerated: true
    });

    return {
      fileName: savedImage.fileName,
      absolutePath: savedImage.absolutePath,
      publicPath: savedImage.publicPath
    };
  } finally {
    await browser.close();
    console.info("[renderer] Browser closed", {
      slug: input.slug,
      durationMs: Date.now() - startedAt
    });
  }
}
