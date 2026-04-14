import { getCurrentUser } from "@/lib/auth";
import { AI_DIGITAL_SOURCE_TYPE } from "@/lib/storage.server.config";
import { inspectAiMetadataInBuffer } from "@/lib/storage-ai-metadata";
import { jsonError } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("Image file is required.");
  }

  const inspection = await inspectAiMetadataInBuffer(
    Buffer.from(await file.arrayBuffer()),
    file.name || "upload.jpg"
  );

  return Response.json({
    exiftoolAvailable: inspection.exiftoolAvailable,
    expectedDigitalSourceType: AI_DIGITAL_SOURCE_TYPE,
    detected: {
      digitalSourceType: inspection.digitalSourceType,
      creator: inspection.creator,
      creatorTool: inspection.creatorTool,
      description: inspection.description,
      credit: inspection.credit,
      rights: inspection.rights
    },
    hasAiMetadata:
      inspection.digitalSourceType === AI_DIGITAL_SOURCE_TYPE ||
      inspection.creator === "InstagramPost AI Publisher" ||
      inspection.creatorTool === "InstagramPost AI Publisher",
    rawOutput: inspection.rawOutput
  });
}
