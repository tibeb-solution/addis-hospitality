import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const uploadRoot = path.resolve(process.cwd(), "local-data", "uploads");
const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { path: parts } = await context.params;
    if (parts.length === 0 || parts[0] !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const target = path.resolve(uploadRoot, ...parts);
    if (!target.startsWith(`${uploadRoot}${path.sep}`))
      return new NextResponse("Not found", { status: 404 });
    const body = await readFile(target);
    return new NextResponse(body, {
      headers: {
        "Content-Type":
          contentTypes[path.extname(target).toLowerCase()] ||
          "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(target)}"`,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
