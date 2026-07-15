import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: { level: true, scenarios: true },
  });
  return NextResponse.json(games);
}

export async function POST(request) {
  const body = await request.json();
  const { slug, name, levelId, occasion, status, scenarioIds } = body;

  if (!slug || !name || !levelId) {
    return NextResponse.json({ error: "slug, name, and levelId are required" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "slug can only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
  }

  try {
    const game = await prisma.game.create({
      data: {
        slug,
        name,
        levelId,
        occasion: occasion || null,
        status: status || "DRAFT",
        scenarios: {
          create: (scenarioIds || []).map((scenarioId, i) => ({ scenarioId, order: i })),
        },
      },
      include: { level: true, scenarios: true },
    });
    return NextResponse.json(game, { status: 201 });
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A game with that slug already exists" }, { status: 409 });
    }
    throw e;
  }
}
