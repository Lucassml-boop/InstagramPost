import { getCurrentUser } from "@/lib/auth";
import {
  handleClearTopicsHistory,
  handleGetTopicsHistory
} from "@/lib/api-handlers/content-system";

export async function GET() {
  const user = await getCurrentUser();
  return handleGetTopicsHistory(user);
}

export async function DELETE() {
  const user = await getCurrentUser();
  return handleClearTopicsHistory(user);
}
