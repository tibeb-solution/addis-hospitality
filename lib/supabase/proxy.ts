import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Client layouts own auth checks. Avoid a network Auth request on every navigation.
  return NextResponse.next({ request });
}
