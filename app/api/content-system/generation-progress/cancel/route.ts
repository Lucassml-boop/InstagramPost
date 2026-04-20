import { getCurrentUser } from "@/lib/auth";
import { requestGenerationCancellation } from "@/lib/content-system.generation-progress";
import { jsonError } from "@/lib/server-utils";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  return Response.json({
    ok: true,
    progress: requestGenerationCancellation(user.id)
  });
}
