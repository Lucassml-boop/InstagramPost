import {
  INSTAGRAM_API_VERSION,
  MEDIA_CONTAINER_MAX_WAIT_MS,
  MEDIA_CONTAINER_POLL_INTERVAL_MS
} from "./instagram.constants.ts";
import { getInstagramAccessToken, getStoredInstagramUserId } from "./instagram.access-token.ts";

async function assertImageUrlIsReachable(imageUrl: string) {
  let imageProbeResponse: Response | null = null;
  let lastProbeError: unknown = null;

  try {
    imageProbeResponse = await fetch(imageUrl, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store"
    });
  } catch (error) {
    lastProbeError = error;
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
    }
  }

  if (!imageProbeResponse) {
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
  if (!imageProbeResponse.ok) {
    throw new Error(
      `Nao foi possivel publicar no Instagram porque a imagem do post respondeu com status ${imageProbeResponse.status} na URL publica. Verifique se o dominio ou tunel publico esta ativo e se a imagem abre normalmente fora da sua maquina.`
    );
  }
  if (!imageContentType?.startsWith("image/")) {
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
    const statusResponse = await fetch(
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
  const publishResponse = await fetch(
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
  if (!publishResponse.ok || !publishJson.id) {
    throw new Error(publishJson.error?.message ?? "Unable to publish Instagram media.");
  }
  return { mediaId: String(publishJson.id) };
}

export { assertImageUrlIsReachable };
