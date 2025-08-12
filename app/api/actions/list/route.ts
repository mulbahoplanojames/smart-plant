import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const s = await getSession()
    if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const devices = await prisma.device.findMany({ where: { ownerId: s.uid }, select: { id: true } })
    const ids = devices.map((d) => d.id)
    if (!ids.length) return NextResponse.json({ data: [] })

    const rows = await prisma.command.findMany({
      where: { deviceId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, deviceId: true, action: true, state: true, status: true, createdAt: true },
    })
    const data = rows.map((r) => ({ ...r, createdAt: r.createdAt?.toISOString?.() }))
    return NextResponse.json({ data })
  } catch (e: any) {
    console.error("GET /api/actions/list error:", e)
    return NextResponse.json({ error: "server_error", message: e?.message }, { status: 500 })
  }
}
