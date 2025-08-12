import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await prisma.plant.findMany({
    where: { userId: s.uid },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      species: true,
      notes: true,
      deviceId: true,
      threshold: true,
    },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  try {
    const s = await getSession();
    if (!s)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { deviceId, species, name, notes, threshold } = body || {};
    if (!name)
      return NextResponse.json({ error: "missing_name" }, { status: 400 });
    console.log("Plant create payload:", {
      userId: s.uid,
      deviceId: deviceId || null,
      species: species || null,
      name,
      notes: notes || null,
      threshold: threshold ?? null,
    });
    const p = await prisma.plant.create({
      data: {
        deviceId: deviceId || null,
        species: species || null,
        name,
        notes: notes || null,
        threshold: threshold ?? null,
        user: {
          connect: { id: s.uid },
        },
      },
      select: { id: true },
    });
    return NextResponse.json({ id: p.id });
  } catch (e: any) {
    console.error("POST /api/plants error:", e);
    return NextResponse.json(
      { error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}
