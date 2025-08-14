import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const deviceId = (req.nextUrl.searchParams.get("deviceId") || "").trim();
  if (!deviceId)
    return NextResponse.json({ error: "missing_deviceId" }, { status: 400 });

  const own = await prisma.device.findFirst({
    where: { id: deviceId, ownerId: s.uid },
    select: { id: true },
  });
  if (!own) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastAt = new Date(0).toISOString();
      const tick = async () => {
        try {
          const rows = await prisma.telemetry.findMany({
            where: { deviceId, at: { gt: new Date(lastAt) } },
            orderBy: { at: "asc" },
            take: 100,
            select: {
              at: true,
              moisture: true,
              pumpOn: true,
              temperature: true,
              humidity: true,
            },
          });
          if (rows.length) {
            lastAt = rows[rows.length - 1].at.toISOString();
            const payload = rows.map((r) => ({
              at: r.at.toISOString(),
              moisture: r.moisture,
              pumpOn: !!r.pumpOn,
              temperature: r.temperature,
              humidity: r.humidity,
            }));
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            );
          }
        } catch {
          controller.enqueue(
            encoder.encode(`event: error\ndata: "query_failed"\n\n`)
          );
        }
      };
      const interval = setInterval(tick, 2000);
      const ping = setInterval(
        () => controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`)),
        15000
      );

      tick();

      const close = () => {
        clearInterval(interval);
        clearInterval(ping);
        controller.close();
      };
      (req as any).signal?.addEventListener?.("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
