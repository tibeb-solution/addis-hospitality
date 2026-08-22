import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;
const uploadRoot = path.resolve(process.cwd(), "local-data", "uploads");

function safePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function absoluteStoredPath(storedPath: string) {
  const target = path.resolve(uploadRoot, storedPath);
  if (target !== uploadRoot && !target.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Invalid file path");
  return target;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : user;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.formData();
  const file = data.get("file");
  const ownerId = safePart(user.id);
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size === 0 || file.size > maxBytes) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const extension = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
  const storedPath = `${ownerId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
  const target = absoluteStoredPath(storedPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ path: storedPath, url: `/api/local-files/${storedPath}` });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { path: storedPath } = await request.json();
    const requestedPath = String(storedPath || "");
    if (!requestedPath.startsWith(`${safePart(user.id)}/`)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await rm(absoluteStoredPath(requestedPath), { force: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
}
