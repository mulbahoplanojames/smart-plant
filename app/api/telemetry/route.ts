import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const s = await getSession()
    if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const deviceId = (req.nextUrl.searchParams.get("deviceId") || "").trim()
    const lim = Math.min(Number(req.nextUrl.searchParams.get("limit") || "200"), 1000)
    if (!deviceId) return NextResponse.json({ error: "missing_deviceId" }, { status: 400 })

    const own = await prisma.device.findFirst({ where: { id: deviceId, ownerId: s.uid }, select: { id: true } })
    if (!own) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const rows = await prisma.telemetry.findMany({
      where: { deviceId },
      orderBy: { at: "asc" },
      take: lim,
      select: { at: true, moisture: true, pumpOn: true },
    })
    const data = rows.map((r) => ({ at: r.at.toISOString(), moisture: r.moisture, pumpOn: !!r.pumpOn }))
    return NextResponse.json({ data })
  } catch (e: any) {
    console.error("GET /api/telemetry error:", e)
    return NextResponse.json({ error: "server_error", message: e?.message }, { status: 500 })
  }
}
