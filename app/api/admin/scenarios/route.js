import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const scenarios = await prisma.scenario.findMany({
    orderBy: { createdAt: "desc" },
    include: { competencyA: true, competencyB: true, options: true },
  });
  return NextResponse.json(scenarios);
}

function validateOptions(options) {
  if (!Array.isArray(options) || options.length !== 4) {
    return "Exactly 4 options are required";
  }
  for (const opt of options) {
    if (!opt.text) return "Every option needs text";
    for (const field of ["scoreA", "scoreB"]) {
      const v = Number(opt[field]);
      if (!Number.isInteger(v) || v < 1 || v > 4) return `${field} must be an integer 1-4`;
    }
    if (!opt.whyA || !opt.whyB) return "Every option needs a why explanation for both competencies";
  }
  return null;
}

export async function POST(request) {
  const body = await request.json();
  const { title, prompt, occasion, difficulty, status, competencyAId, competencyBId, options } = body;

  if (!title || !prompt || !competencyAId || !competencyBId) {
    return NextResponse.json(
      { error: "title, prompt, competencyAId, and competencyBId are required" },
      { status: 400 }
    );
  }
  if (competencyAId === competencyBId) {
    return NextResponse.json({ error: "Competency A and B must be different" }, { status: 400 });
  }
  const optionsError = validateOptions(options);
  if (optionsError) {
    return NextResponse.json({ error: optionsError }, { status: 400 });
  }

  const scenario = await prisma.scenario.create({
    data: {
      title,
      prompt,
      occasion: occasion || null,
      difficulty: difficulty || null,
      status: status || "DRAFT",
      competencyAId,
      competencyBId,
      options: {
        create: options.map((opt, i) => ({
          text: opt.text,
          order: i,
          scoreA: Number(opt.scoreA),
          whyA: opt.whyA,
          scoreB: Number(opt.scoreB),
          whyB: opt.whyB,
          isRedFlag: !!opt.isRedFlag,
          redFlagNote: opt.isRedFlag ? opt.redFlagNote || null : null,
        })),
      },
    },
    include: { options: true },
  });
  return NextResponse.json(scenario, { status: 201 });
}
