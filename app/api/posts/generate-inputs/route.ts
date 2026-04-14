import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  generateAutomaticCreatePostInputs,
  getContentBrandProfile
} from "@/lib/content-system";
import { jsonError } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = (await request.json()) as {
      current: {
        topic: string;
        message: string;
        postType: "feed" | "story" | "carousel";
        tone: "professional" | "casual" | "promotional";
        brandColors: string;
        keywords: string;
        carouselSlideCount: number;
        carouselSlideContexts: string[];
        outputLanguage: "en" | "pt-BR";
        customInstructions: string;
      };
      userTopicHint?: string;
    };
    const profile = await getContentBrandProfile();
    const result = await generateAutomaticCreatePostInputs({
      profile,
      current: body.current,
      userTopicHint: body.userTopicHint
    });

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Create-post automatic generation failed.",
      500
    );
  }
}
