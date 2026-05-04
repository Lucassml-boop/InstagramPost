import fs from "node:fs";
import path from "node:path";

function getLocalGeneratedAssetInfo(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    if (!url.pathname.startsWith("/generated-posts/")) {
      return null;
    }

    const relativePath = url.pathname.replace(/^\/+/, "").split("/").map(decodeURIComponent);
    const localPath = path.join(process.cwd(), "public", ...relativePath);
    const stats = fs.existsSync(localPath) ? fs.statSync(localPath) : null;

    return {
      localPath,
      exists: Boolean(stats?.isFile()),
      bytes: stats?.isFile() ? stats.size : null,
      lastWriteTime: stats?.isFile() ? stats.mtime.toISOString() : null
    };
  } catch {
    return null;
  }
}

function getPublicImageProbeContext(imageUrl: string) {
  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    parsedUrl = null;
  }

  const isTryCloudflare = parsedUrl?.hostname.endsWith(".trycloudflare.com") ?? false;

  return {
    imageUrl,
    imageHost: parsedUrl?.hostname ?? null,
    imagePath: parsedUrl?.pathname ?? null,
    appBaseUrl: process.env.APP_BASE_URL ?? null,
    fixedPublicUrl: process.env.FIXED_PUBLIC_URL ?? null,
    isTryCloudflare,
    localAsset: getLocalGeneratedAssetInfo(imageUrl),
    likelyCause: isTryCloudflare
      ? "O dominio trycloudflare e temporario. Se o processo do tunnel antigo caiu ou npm run dev foi reiniciado com FIXED_PUBLIC_URL, essa URL pode deixar de existir."
      : "A URL publica nao respondeu ao probe do servidor.",
    nextSteps: [
      "Abra a URL da imagem em uma janela anonima ou em outro dispositivo/rede.",
      "Confirme que APP_BASE_URL aponta para um dominio publico ativo.",
      isTryCloudflare
        ? "Para trycloudflare, mantenha o mesmo processo cloudflared vivo ou crie um novo tunnel e atualize APP_BASE_URL, INSTAGRAM_REDIRECT_URI e o callback na Meta."
        : "Verifique DNS, HTTPS, firewall e se a rota /generated-posts esta servindo o arquivo."
    ]
  };
}

function getErrorCause(error: Error) {
  return "cause" in error ? String((error as { cause?: unknown }).cause) : null;
}

async function fetchPublicImage(imageUrl: string, method: "HEAD" | "GET") {
  return fetch(imageUrl, {
    method,
    redirect: "follow",
    cache: "no-store"
  });
}

export async function assertImageUrlIsReachable(imageUrl: string) {
  let imageProbeResponse: Response | null = null;
  let lastProbeError: unknown = null;
  const probeContext = getPublicImageProbeContext(imageUrl);

  console.info("[instagram-media] Public image probe started", probeContext);

  try {
    imageProbeResponse = await fetchPublicImage(imageUrl, "HEAD");
  } catch (error) {
    lastProbeError = error;
    console.warn("[instagram-media] Public image HEAD probe failed, trying GET fallback", {
      ...probeContext,
      detail: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : null,
      errorCause: error instanceof Error ? getErrorCause(error) : null
    });
  }

  if (!imageProbeResponse || !imageProbeResponse.ok) {
    try {
      imageProbeResponse = await fetchPublicImage(imageUrl, "GET");
    } catch (error) {
      lastProbeError = error;
      console.warn("[instagram-media] Public image GET fallback failed", {
        ...probeContext,
        previousHeadStatus: imageProbeResponse?.status ?? null,
        detail: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : null,
        errorCause: error instanceof Error ? getErrorCause(error) : null
      });
    }
  }

  if (!imageProbeResponse) {
    console.error("[instagram-media] Public image probe failed", {
      ...probeContext,
      detail: lastProbeError instanceof Error ? lastProbeError.message : String(lastProbeError),
      errorName: lastProbeError instanceof Error ? lastProbeError.name : null,
      errorCause: lastProbeError instanceof Error ? getErrorCause(lastProbeError) : null
    });

    throw new Error(
      [
        "Nao foi possivel publicar no Instagram porque a imagem do post nao esta acessivel por uma URL publica.",
        "O Instagram precisa conseguir abrir essa imagem pela internet antes de publicar.",
        "Verifique se o APP_BASE_URL aponta para um dominio ou tunel publico ativo e se esse link funciona fora da sua maquina.",
        `URL da imagem: ${imageUrl}`,
        lastProbeError instanceof Error ? `Detalhe tecnico: ${lastProbeError.message}` : null
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  const imageContentType = imageProbeResponse.headers.get("content-type");
  const imageContentLength = imageProbeResponse.headers.get("content-length");

  console.info("[instagram-media] Public image probe completed", {
    ...probeContext,
    status: imageProbeResponse.status,
    contentType: imageContentType,
    contentLength: imageContentLength
  });

  if (!imageProbeResponse.ok) {
    console.error("[instagram-media] Public image probe returned non-OK status", {
      ...probeContext,
      status: imageProbeResponse.status,
      statusText: imageProbeResponse.statusText,
      contentType: imageContentType,
      contentLength: imageContentLength
    });
    throw new Error(
      `Nao foi possivel publicar no Instagram porque a imagem do post respondeu com status ${imageProbeResponse.status} na URL publica. Verifique se o dominio ou tunel publico esta ativo e se a imagem abre normalmente fora da sua maquina.`
    );
  }

  if (!imageContentType?.startsWith("image/")) {
    console.error("[instagram-media] Public image probe returned invalid content-type", {
      ...probeContext,
      status: imageProbeResponse.status,
      contentType: imageContentType,
      contentLength: imageContentLength
    });
    throw new Error(
      `Nao foi possivel publicar no Instagram porque a URL publica do post nao retornou uma imagem valida. O servidor respondeu com content-type ${imageContentType ?? "desconhecido"}.`
    );
  }
}
