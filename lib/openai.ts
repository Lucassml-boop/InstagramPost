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

  const styleGuide =
    firstSlide.styleGuide?.trim() ||
    "Match the first slide's composition, typography rhythm, and color balance closely.";
  const slides: GeneratedPost[] = [firstSlide];

  for (let index = 1; index < slideCount; index += 1) {
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

    slides.push({
      ...slide,
      caption: firstSlide.caption,
      hashtags: firstSlide.hashtags,
      styleGuide
    });
  }

  return {
    slides,
    caption: firstSlide.caption,
    hashtags: firstSlide.hashtags
  };
}
