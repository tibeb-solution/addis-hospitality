import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(_request: NextRequest) {
  // No-op for local-storage based auth
  return NextResponse.next();
}
