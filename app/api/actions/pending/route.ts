import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const deviceId = (req.nextUrl.searchParams.get("deviceId") || "").trim()
    const secret = (req.nextUrl.searchParams.get("secret") || "").trim() || req.headers.get("x-device-secret") || ""
    if (!deviceId || !secret) return NextResponse.json({ error: "missing_fields" }, { status: 400 })

    const dev = await prisma.device.findUnique({ where: { id: deviceId }, select: { secret: true } })
    if (!dev) return NextResponse.json({ error: "device_not_found" }, { status: 404 })
    if (dev.secret !== secret) return NextResponse.json({ error: "invalid_secret" }, { status: 403 })

    const rows = await prisma.command.findMany({
      where: { deviceId, status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 5,
    })
    return NextResponse.json({ data: rows })
  } catch (e: any) {
    console.error("GET /api/actions/pending error:", e)
    return NextResponse.json({ error: "server_error", message: e?.message }, { status: 500 })
  }
}
