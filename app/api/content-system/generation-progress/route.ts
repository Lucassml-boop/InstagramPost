import { getCurrentUser } from "@/lib/auth";
import { getGenerationProgress } from "@/lib/content-system.generation-progress";
import { jsonError } from "@/lib/server-utils";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  return Response.json({
    ok: true,
    progress: await getGenerationProgress(user.id)
  });
}
