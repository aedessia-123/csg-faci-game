import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const levels = await prisma.level.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(levels);
}

export async function POST(request) {
  const body = await request.json();
  const { key, name, tagline, intro, threshold, nextLevelName } = body;
  if (!key || !name || !tagline || !intro) {
    return NextResponse.json({ error: "key, name, tagline, and intro are required" }, { status: 400 });
  }
  const level = await prisma.level.create({
    data: {
      key,
      name,
      tagline,
      intro,
      threshold: threshold ? Number(threshold) : 12,
      nextLevelName: nextLevelName || null,
    },
  });
  return NextResponse.json(level, { status: 201 });
}
