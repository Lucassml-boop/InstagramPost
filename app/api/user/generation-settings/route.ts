import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/server-utils";
import { generationSettingsSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = generationSettingsSchema.parse(await request.json());

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        preferredOutputLanguage: parsed.outputLanguage,
        preferredCustomInstructions: parsed.customInstructions.trim() || null
      },
      select: {
        preferredOutputLanguage: true,
        preferredCustomInstructions: true
      }
    });

    return NextResponse.json({
      outputLanguage: updatedUser.preferredOutputLanguage === "pt-BR" ? "pt-BR" : "en",
      customInstructions: updatedUser.preferredCustomInstructions ?? ""
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to save generation settings."
    );
  }
}
