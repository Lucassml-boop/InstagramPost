import { getCurrentUser } from "@/lib/auth";
import { handlePublishPost } from "@/lib/api-handlers/posts";
import { getRequestOrigin } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  return handlePublishPost(request, user, getRequestOrigin(request));
}
