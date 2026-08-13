import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  const data = await request.formData();
  const file = data.get("file");
  const ownerId = String(data.get("ownerId") || "");
  if (!(file instanceof File) || !safePart(ownerId) || !allowedTypes.has(file.type) || file.size > maxBytes) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const extension = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
  const storedPath = `${safePart(ownerId)}/${Date.now()}-${crypto.randomUUID()}${extension}`;
  const target = absoluteStoredPath(storedPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ path: storedPath, url: `/api/local-files/${storedPath}` });
}

export async function DELETE(request: Request) {
  try {
    const { path: storedPath } = await request.json();
    await rm(absoluteStoredPath(String(storedPath || "")), { force: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
}
