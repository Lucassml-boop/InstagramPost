import { saveGeneratedImageBuffer } from "@/lib/storage.server";

const RENDER_TIMEOUT_MS = 120_000;
const RENDER_HEARTBEAT_MS = 10_000;

async function launchRendererBrowser() {
  const isServerlessLinux =
    process.platform === "linux" &&
    (Boolean(process.env.VERCEL) || Boolean(process.env.AWS_EXECUTION_ENV));

  if (isServerlessLinux) {
    const [{ default: chromium }, { default: puppeteerCore }] = await Promise.all([
      import("@sparticuz/chromium"),
      import("puppeteer-core")
    ]);

    const executablePath = await chromium.executablePath();

    console.info("[renderer] Using serverless Chromium", {
      platform: process.platform,
      executablePath
    });

    return puppeteerCore.launch({
      executablePath,
      args: chromium.args,
      headless: true
    });
  }

  const { default: puppeteer } = await import("puppeteer");
  const executablePath = puppeteer.executablePath();

  console.info("[renderer] Using local Puppeteer browser", {
    platform: process.platform,
    executablePath
  });

  return puppeteer.launch({
    executablePath,
    headless: true
  });
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
  let renderPhase = "launching-browser";
  const heartbeat = setInterval(() => {
    console.info("[renderer] Image render still running", {
      slug: input.slug,
      phase: renderPhase,
      durationMs: Date.now() - startedAt,
      timeoutMs: RENDER_TIMEOUT_MS
    });
  }, RENDER_HEARTBEAT_MS);

  console.info("[renderer] Starting image render", {
    slug: input.slug,
    width: input.width,
    height: input.height,
    htmlLength: input.html.length,
    cssLength: input.css.length
  });

  let browser: Awaited<ReturnType<typeof launchRendererBrowser>> | null = null;

  try {
    browser = await launchRendererBrowser();
    console.info("[renderer] Browser launched", {
      slug: input.slug,
      durationMs: Date.now() - startedAt
    });

    renderPhase = "creating-page";
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

    renderPhase = "setting-viewport";
    await page.setViewport({ width: input.width, height: input.height, deviceScaleFactor: 1 });
    renderPhase = "setting-content";
    await page.setContent(buildHtmlDocument(input.html, input.css), {
      waitUntil: "domcontentloaded",
      timeout: RENDER_TIMEOUT_MS
    });

    // The generated layout is self-contained, so a short settle delay is enough
    // and avoids waiting forever for "networkidle" when the page never becomes idle.
    renderPhase = "settling-content";
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.info("[renderer] Content rendered in page", {
      slug: input.slug,
      durationMs: Date.now() - startedAt
    });

    renderPhase = "taking-screenshot";
    console.info("[renderer] Taking screenshot", {
      slug: input.slug,
      durationMs: Date.now() - startedAt
    });
    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 90
    });

    renderPhase = "saving-image";
    console.info("[renderer] Saving generated image", {
      slug: input.slug,
      bytes: buffer.length,
      durationMs: Date.now() - startedAt
    });
    const savedImage = await saveGeneratedImageBuffer({
      bytes: Buffer.from(buffer),
      slug: input.slug,
      markAsAiGenerated: true
    });
    console.info("[renderer] Generated image saved", {
      slug: input.slug,
      publicPath: savedImage.publicPath,
      durationMs: Date.now() - startedAt
    });

    return {
      fileName: savedImage.fileName,
      absolutePath: savedImage.absolutePath,
      publicPath: savedImage.publicPath
    };
  } finally {
    clearInterval(heartbeat);
    if (browser) {
      await browser.close();
      console.info("[renderer] Browser closed", {
        slug: input.slug,
        durationMs: Date.now() - startedAt
      });
    }
  }
}
