import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const competencies = await prisma.competency.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(competencies);
}

export async function POST(request) {
  const body = await request.json();
  const { key, name, icon, definition } = body;
  if (!key || !name || !icon || !definition) {
    return NextResponse.json({ error: "key, name, icon, and definition are required" }, { status: 400 });
  }
  const competency = await prisma.competency.create({ data: { key, name, icon, definition } });
  return NextResponse.json(competency, { status: 201 });
}
