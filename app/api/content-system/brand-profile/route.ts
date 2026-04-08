import { getCurrentUser } from "@/lib/auth";
import {
  handleGetBrandProfile,
  handleUpdateBrandProfile
} from "@/lib/api-handlers/content-system";

export async function GET() {
  const user = await getCurrentUser();
  return handleGetBrandProfile(user);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  return handleUpdateBrandProfile(request, user);
}
