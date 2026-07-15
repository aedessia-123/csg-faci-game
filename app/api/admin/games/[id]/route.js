import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      level: true,
      scenarios: {
        orderBy: { order: "asc" },
        include: { scenario: { include: { competencyA: true, competencyB: true } } },
      },
    },
  });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { slug, name, levelId, occasion, status, scenarioIds } = body;

  if (!slug || !name || !levelId) {
    return NextResponse.json({ error: "slug, name, and levelId are required" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "slug can only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
  }

  try {
    const game = await prisma.$transaction(async (tx) => {
      if (scenarioIds) {
        await tx.gameScenario.deleteMany({ where: { gameId: id } });
      }
      return tx.game.update({
        where: { id },
        data: {
          slug,
          name,
          levelId,
          occasion: occasion || null,
          status: status || "DRAFT",
          version: { increment: 1 },
          ...(scenarioIds
            ? { scenarios: { create: scenarioIds.map((scenarioId, i) => ({ scenarioId, order: i })) } }
            : {}),
        },
        include: { level: true, scenarios: true },
      });
    });
    return NextResponse.json(game);
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A game with that slug already exists" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await prisma.game.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
