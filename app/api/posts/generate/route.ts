import { getCurrentUser } from "@/lib/auth";
import { handleGeneratePost } from "@/lib/api-handlers/posts";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  return handleGeneratePost(request, user);
}
