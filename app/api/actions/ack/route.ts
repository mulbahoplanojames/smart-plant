import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const deviceId = (body.deviceId as string) || ""
    const secret = (body.secret as string) || ""
    const commandId = (body.commandId as string) || ""
    const status = (body.status as string) || "done"
    if (!deviceId || !secret || !commandId) return NextResponse.json({ error: "missing_fields" }, { status: 400 })

    const dev = await prisma.device.findUnique({ where: { id: deviceId }, select: { secret: true } })
    if (!dev) return NextResponse.json({ error: "device_not_found" }, { status: 404 })
    if (dev.secret !== secret) return NextResponse.json({ error: "invalid_secret" }, { status: 403 })

    await prisma.command.update({ where: { id: commandId }, data: { status } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("POST /api/actions/ack error:", e)
    return NextResponse.json({ error: "server_error", message: e?.message }, { status: 500 })
  }
}
