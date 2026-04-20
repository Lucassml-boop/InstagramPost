import { generatePostSchema } from "@/lib/validators";
import {
  getOllamaTimeoutForInput,
  type AutomationContext,
  type GeneratePostInput,
  type GeneratedPost
} from "./openai.shared.ts";
import { requestInstagramPostGeneration } from "./openai.client.ts";

export { getOllamaTimeoutForInput };

export async function generateInstagramPost(
  input: GeneratePostInput,
  automationContext?: AutomationContext
) {
  return requestInstagramPostGeneration(generatePostSchema.parse(input), undefined, automationContext);
}

export async function generateInstagramCarouselPosts(
  input: GeneratePostInput,
  automationContext?: AutomationContext
) {
  const parsedInput = generatePostSchema.parse(input);
  const slideCount = parsedInput.postType === "carousel" ? parsedInput.carouselSlideCount : 1;
  const slideContexts = Array.from({ length: slideCount }, (_, index) => {
    const raw = parsedInput.carouselSlideContexts[index]?.trim();
    return raw || `Slide ${index + 1} should support the same campaign narrative.`;
  });

  const firstSlide = await requestInstagramPostGeneration(
    parsedInput,
    {
      slideIndex: 1,
      slideCount,
      slideContext: slideContexts[0],
      requireCaption: true
    },
    automationContext
  );
  console.info("[openai] Carousel first slide ready", {
    topic: parsedInput.topic,
    slideCount,
    hasStyleGuide: Boolean(firstSlide.styleGuide?.trim())
  });

  const styleGuide =
    firstSlide.styleGuide?.trim() ||
    "Match the first slide's composition, typography rhythm, and color balance closely.";
  console.info("[openai] Carousel remaining slides starting", {
    topic: parsedInput.topic,
    remainingSlides: Math.max(slideCount - 1, 0)
  });
  const remainingSlides = await Promise.all(
    Array.from({ length: Math.max(slideCount - 1, 0) }, async (_, offset) => {
      const index = offset + 1;
      console.info("[openai] Carousel slide generation queued", {
        topic: parsedInput.topic,
        slideIndex: index + 1,
        slideCount
      });
      const slide = await requestInstagramPostGeneration(
        parsedInput,
        {
          slideIndex: index + 1,
          slideCount,
          slideContext: slideContexts[index],
          styleGuide,
          requireCaption: false
        },
        automationContext
      );
      console.info("[openai] Carousel slide ready", {
        topic: parsedInput.topic,
        slideIndex: index + 1,
        slideCount
      });

      return {
        ...slide,
        caption: firstSlide.caption,
        hashtags: firstSlide.hashtags,
        styleGuide
      };
    })
  );
  const slides: GeneratedPost[] = [firstSlide, ...remainingSlides];
  console.info("[openai] Carousel generation complete", {
    topic: parsedInput.topic,
    slideCount: slides.length
  });

  return {
    slides,
    caption: firstSlide.caption,
    hashtags: firstSlide.hashtags
  };
}
