import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { slug } = await params;

  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      level: true,
      scenarios: {
        orderBy: { order: "asc" },
        include: {
          scenario: {
            include: {
              competencyA: true,
              competencyB: true,
              options: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!game || game.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Order competencies by their stable global order (creation order), not by
  // which scenario happens to reference them first, so the dashboard/legend
  // order is consistent across games.
  const allCompetencies = await prisma.competency.findMany({ orderBy: { createdAt: "asc" } });
  const usedKeys = new Set();
  game.scenarios.forEach(({ scenario }) => {
    usedKeys.add(scenario.competencyA.key);
    usedKeys.add(scenario.competencyB.key);
  });
  const compOrder = allCompetencies.filter((c) => usedKeys.has(c.key)).map((c) => c.key);
  const competencies = {};
  allCompetencies.forEach((c) => {
    if (usedKeys.has(c.key)) {
      competencies[c.key] = { name: c.name, icon: c.icon, def: c.definition };
    }
  });

  const questions = game.scenarios.map(({ scenario }) => {
    return {
      title: scenario.title,
      text: scenario.prompt,
      comps: [scenario.competencyA.key, scenario.competencyB.key],
      options: scenario.options.map((opt) => ({
        text: opt.text,
        scores: [opt.scoreA, opt.scoreB],
        why: [opt.whyA, opt.whyB],
        redFlagNote: opt.isRedFlag ? opt.redFlagNote : undefined,
      })),
    };
  });

  const config = {
    collectionLabel: "The Facilitator Matrix",
    game: { name: game.name },
    level: {
      key: game.level.key,
      name: game.level.name,
      tagline: game.level.tagline,
      intro: game.level.intro,
      threshold: game.level.threshold,
      nextLevelName: game.level.nextLevelName,
    },
    competencies,
    compOrder,
    questions,
  };

  return NextResponse.json(config);
}
