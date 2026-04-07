import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { getBaseUrl } from "@/lib/env";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(new URL("/login", getBaseUrl()));
}
