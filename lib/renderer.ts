import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

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
        width: 1080px;
        height: 1080px;
        overflow: hidden;
        background: #ffffff;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .frame {
        position: relative;
        width: 1080px;
        height: 1080px;
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
}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    await page.setContent(buildHtmlDocument(input.html, input.css), {
      waitUntil: "networkidle0"
    });

    const outputDir = path.join(process.cwd(), "public", "generated-posts");
    await mkdir(outputDir, { recursive: true });
    const fileName = `${Date.now()}-${input.slug}.png`;
    const absolutePath = path.join(outputDir, fileName);
    const buffer = await page.screenshot({
      type: "png"
    });

    await writeFile(absolutePath, buffer);

    return {
      fileName,
      absolutePath,
      publicPath: `/generated-posts/${fileName}`
    };
  } finally {
    await browser.close();
  }
}
