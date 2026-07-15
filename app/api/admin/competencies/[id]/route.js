import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { key, name, icon, definition } = body;
  const competency = await prisma.competency.update({
    where: { id },
    data: { key, name, icon, definition },
  });
  return NextResponse.json(competency);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.competency.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Can't delete a competency that's still used by a scenario." },
      { status: 409 }
    );
  }
}
