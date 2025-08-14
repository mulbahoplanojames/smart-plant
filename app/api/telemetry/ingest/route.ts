import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const deviceId =
      (body.deviceId as string) || req.headers.get("x-device-id") || "";
    const secret =
      (body.secret as string) || req.headers.get("x-device-secret") || "";
    const moisture = Number(body.moisture);
    const temperature =
      body.temperature !== undefined ? Number(body.temperature) : undefined;
    const humidity = Number(body.humidity);
    const pumpOn = !!body.pumpOn;
    const atIso = (body.at as string) || new Date().toISOString();

    if (
      !deviceId ||
      !secret ||
      Number.isNaN(moisture) ||
      (temperature !== undefined && Number.isNaN(temperature))
    ) {
      return NextResponse.json(
        { error: "missing_or_invalid_fields" },
        { status: 400 }
      );
    }

    const dev = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { secret: true, ownerId: true, name: true, threshold: true },
    });
    if (!dev)
      return NextResponse.json({ error: "device_not_found" }, { status: 404 });
    if (dev.secret !== secret)
      return NextResponse.json({ error: "invalid_secret" }, { status: 403 });

    await prisma.telemetry.create({
      data: {
        deviceId,
        at: new Date(atIso),
        moisture,
        temperature,
        pumpOn,
        humidity,
      },
    });
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastMoisture: moisture,
        lastTemperature: temperature !== undefined ? temperature : null,
        lastHumidity: !isNaN(humidity) ? humidity : null,
        pumpOn,
        lastSeen: new Date(),
        updatedAt: new Date(),
      },
    });

    // Optional: hook for notifications can be added here

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/telemetry/ingest error:", e);
    return NextResponse.json(
      { error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}
