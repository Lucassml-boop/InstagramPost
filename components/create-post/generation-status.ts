import {
  CAROUSEL_EXTRA_TIMEOUT_PER_SLIDE_MS,
  CLIENT_TIMEOUT_BASE_MS
} from "./constants";
import type { GenerationStatus, OutputLanguage, PostType } from "./types";

export function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getClientGenerationTimeoutMs(postType: PostType, carouselSlideCount: number) {
  if (postType !== "carousel") {
    return CLIENT_TIMEOUT_BASE_MS;
  }

  return CLIENT_TIMEOUT_BASE_MS + carouselSlideCount * CAROUSEL_EXTRA_TIMEOUT_PER_SLIDE_MS;
}

function getGenerationStatusText(outputLanguage: OutputLanguage) {
  if (outputLanguage === "pt-BR") {
    return {
      labelPrefix: "Status estimado",
      preparing: "Preparando requisicao",
      ai: "IA escrevendo e montando o layout",
      rendering: "Renderizando imagem",
      saving: "Salvando rascunho",
      preparingDetail: "Validando campos, briefing, cores e contexto antes de chamar a IA.",
      aiDetail: "Aguardando a resposta do modelo. Esta costuma ser a etapa mais longa.",
      carouselAiDetail:
        "Aguardando a resposta do modelo. Em carrossel, a IA pode gerar os slides em mais de uma chamada.",
      renderingDetail: "Depois da IA, o servidor abre o renderizador e transforma HTML/CSS em imagem.",
      savingDetail: "Finalizando arquivos e registro do post para liberar a previa.",
      pending: "Pendente",
      active: "Em andamento",
      done: "Concluido"
    };
  }

  return {
    labelPrefix: "Estimated status",
    preparing: "Preparing request",
    ai: "AI writing and building layout",
    rendering: "Rendering image",
    saving: "Saving draft",
    preparingDetail: "Validating fields, briefing, colors, and context before calling AI.",
    aiDetail: "Waiting for the model response. This is usually the longest step.",
    carouselAiDetail:
      "Waiting for the model response. For carousels, AI may generate slides across multiple calls.",
    renderingDetail: "After AI responds, the server opens the renderer and converts HTML/CSS into an image.",
    savingDetail: "Finalizing files and the post record before showing the preview.",
    pending: "Pending",
    active: "In progress",
    done: "Done"
  };
}

export function getGenerationStatus(input: {
  elapsedMs: number;
  clientTimeoutMs: number;
  postType: PostType;
  carouselSlideCount: number;
  outputLanguage: OutputLanguage;
}): GenerationStatus {
  const text = getGenerationStatusText(input.outputLanguage);
  const progressRatio = input.clientTimeoutMs > 0 ? input.elapsedMs / input.clientTimeoutMs : 0;
  const activeIndex =
    input.elapsedMs < 2_000
      ? 0
      : progressRatio < 0.78
        ? 1
        : progressRatio < 0.92
          ? 2
          : 3;
  const labels = [text.preparing, text.ai, text.rendering, text.saving];
  const details = [
    text.preparingDetail,
    input.postType === "carousel"
      ? `${text.carouselAiDetail} (${input.carouselSlideCount} slides.)`
      : text.aiDetail,
    text.renderingDetail,
    text.savingDetail
  ];

  return {
    label: `${text.labelPrefix}: ${labels[activeIndex]}`,
    detail: details[activeIndex],
    steps: labels.map((label, index) => ({
      label,
      status: index < activeIndex ? "done" : index === activeIndex ? "active" : "pending"
    }))
  };
}
