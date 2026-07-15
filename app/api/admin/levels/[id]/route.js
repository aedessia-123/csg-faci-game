import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { key, name, tagline, intro, threshold, nextLevelName } = body;
  const level = await prisma.level.update({
    where: { id },
    data: {
      key,
      name,
      tagline,
      intro,
      threshold: threshold ? Number(threshold) : 12,
      nextLevelName: nextLevelName || null,
    },
  });
  return NextResponse.json(level);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.level.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Can't delete a level that still has games." }, { status: 409 });
  }
}
