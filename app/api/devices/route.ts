import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { randomId } from "@/lib/ids";

export async function GET() {
  try {
    const s = await getSession();
    if (!s)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const rows = await prisma.device.findMany({
      where: { ownerId: s.uid },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        threshold: true,
        lastMoisture: true,
        lastSeen: true,
        lastTemperature: true,
        lastHumidity: true,
      },
    });

    console.log("rows", rows);
    return NextResponse.json({ data: rows });
  } catch (e: any) {
    console.error("GET /api/devices error:", e);
    return NextResponse.json(
      { error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const s = await getSession();
    if (!s)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({} as any));
    const name = (body.name as string)?.trim();
    if (!name)
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    const secret = randomId(32);
    const device = await prisma.device.create({
      data: { name, ownerId: s.uid, secret, threshold: 35 },
      select: { id: true, secret: true },
    });
    return NextResponse.json({
      ok: true,
      id: device.id,
      secret: device.secret,
    });
  } catch (e: any) {
    console.error("POST /api/devices error:", e);
    return NextResponse.json(
      { error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}
