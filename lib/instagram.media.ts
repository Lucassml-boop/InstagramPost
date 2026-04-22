import {
  INSTAGRAM_API_VERSION,
  MEDIA_CONTAINER_MAX_WAIT_MS,
  MEDIA_CONTAINER_POLL_INTERVAL_MS
} from "./instagram.constants.ts";
import { getInstagramAccessToken, getStoredInstagramUserId } from "./instagram.access-token.ts";
import fs from "node:fs";
import path from "node:path";

const MEDIA_PUBLISH_MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGraphFetchError(action: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(
    `Nao foi possivel ${action} no Instagram porque a conexao com a Graph API falhou. Verifique sua internet, o tunel publico e tente novamente. Detalhe tecnico: ${detail}`
  );
}

async function fetchInstagramGraph(input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw buildGraphFetchError("continuar a publicacao", error);
  }
}

function isTransientMediaIdUnavailable(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return message.toLowerCase().includes("media id is not available");
}

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

  const publicBaseUrl = process.env.APP_BASE_URL ?? null;
  const fixedPublicUrl = process.env.FIXED_PUBLIC_URL ?? null;
  const localAsset = getLocalGeneratedAssetInfo(imageUrl);
  const isTryCloudflare = parsedUrl?.hostname.endsWith(".trycloudflare.com") ?? false;

  return {
    imageUrl,
    imageHost: parsedUrl?.hostname ?? null,
    imagePath: parsedUrl?.pathname ?? null,
    appBaseUrl: publicBaseUrl,
    fixedPublicUrl,
    isTryCloudflare,
    localAsset,
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

async function assertImageUrlIsReachable(imageUrl: string) {
  let imageProbeResponse: Response | null = null;
  let lastProbeError: unknown = null;
  const probeContext = getPublicImageProbeContext(imageUrl);

  console.info("[instagram-media] Public image probe started", probeContext);

  try {
    imageProbeResponse = await fetch(imageUrl, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store"
    });
  } catch (error) {
    lastProbeError = error;
    console.warn("[instagram-media] Public image HEAD probe failed, trying GET fallback", {
      ...probeContext,
      detail: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : null,
      errorCause:
        error instanceof Error && "cause" in error
          ? String((error as { cause?: unknown }).cause)
          : null
    });
  }

  if (!imageProbeResponse || !imageProbeResponse.ok) {
    try {
      imageProbeResponse = await fetch(imageUrl, {
        method: "GET",
        redirect: "follow",
        cache: "no-store"
      });
    } catch (error) {
      lastProbeError = error;
      console.warn("[instagram-media] Public image GET fallback failed", {
        ...probeContext,
        previousHeadStatus: imageProbeResponse?.status ?? null,
        detail: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : null,
        errorCause:
          error instanceof Error && "cause" in error
            ? String((error as { cause?: unknown }).cause)
            : null
      });
    }
  }

  if (!imageProbeResponse) {
    console.error("[instagram-media] Public image probe failed", {
      ...probeContext,
      detail: lastProbeError instanceof Error ? lastProbeError.message : String(lastProbeError),
      errorName: lastProbeError instanceof Error ? lastProbeError.name : null,
      errorCause:
        lastProbeError instanceof Error && "cause" in lastProbeError
          ? String((lastProbeError as { cause?: unknown }).cause)
          : null
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

export async function createInstagramMediaContainer(input: {
  userId: string;
  caption: string;
  imageUrl: string;
}) {
  const { account, accessToken } = await getInstagramAccessToken(input.userId);
  const instagramUserId = getStoredInstagramUserId(account);
  await assertImageUrlIsReachable(input.imageUrl);
  const mediaResponse = await fetch(
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        image_url: input.imageUrl,
        caption: input.caption
      }).toString()
    }
  );
  const mediaJson = await mediaResponse.json();
  if (!mediaResponse.ok || !mediaJson.id) {
    throw new Error(mediaJson.error?.message ?? "Unable to create Instagram media container.");
  }
  return { accessToken, instagramUserId, creationId: String(mediaJson.id) };
}

export async function waitForInstagramMediaContainer(input: {
  creationId: string;
  accessToken: string;
  instagramUserId: string;
}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt <= MEDIA_CONTAINER_MAX_WAIT_MS) {
    const statusResponse = await fetchInstagramGraph(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${input.creationId}?fields=status_code,status&access_token=${encodeURIComponent(
        input.accessToken
      )}`,
      { cache: "no-store" }
    );
    const statusJson = await statusResponse.json();
    const statusCode = String(statusJson.status_code ?? "");
    const status = String(statusJson.status ?? "");
    if (!statusResponse.ok) {
      throw new Error(
        statusJson.error?.message ?? "Unable to verify Instagram media container status."
      );
    }
    if (statusCode === "FINISHED") {
      return;
    }
    if (statusCode === "ERROR" || status === "ERROR" || statusCode === "EXPIRED") {
      throw new Error(
        `Instagram media container did not become publishable. status_code=${statusCode || "unknown"} status=${status || "unknown"}.`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, MEDIA_CONTAINER_POLL_INTERVAL_MS));
  }
  throw new Error(
    `Instagram media container was not ready after ${Math.round(MEDIA_CONTAINER_MAX_WAIT_MS / 1000)} seconds.`
  );
}

export async function publishInstagramCreation(input: {
  accessToken: string;
  instagramUserId: string;
  creationId: string;
}) {
  await waitForInstagramMediaContainer(input);

  for (let attempt = 0; attempt <= MEDIA_PUBLISH_MAX_RETRIES; attempt += 1) {
    const publishResponse = await fetchInstagramGraph(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${input.instagramUserId}/media_publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ creation_id: input.creationId }).toString()
      }
    );
    const publishJson = await publishResponse.json();

    if (publishResponse.ok && publishJson.id) {
      return { mediaId: String(publishJson.id) };
    }

    const errorMessage = publishJson.error?.message ?? "Unable to publish Instagram media.";
    const canRetry =
      attempt < MEDIA_PUBLISH_MAX_RETRIES &&
      isTransientMediaIdUnavailable(errorMessage);

    if (!canRetry) {
      throw new Error(errorMessage);
    }

    // Meta can return this transient error even after FINISHED; wait and retry publish.
    await waitForInstagramMediaContainer(input);
    await sleep(MEDIA_CONTAINER_POLL_INTERVAL_MS);
  }

  throw new Error("Unable to publish Instagram media.");
}

export { assertImageUrlIsReachable };
