import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const s = await getSession()
    if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { deviceId, action, state, value } = (body || {}) as {
      deviceId: string
      action: string
      state?: boolean
      value?: any
    }
    if (!deviceId || !action) return NextResponse.json({ error: "missing_fields" }, { status: 400 })

    const own = await prisma.device.findFirst({ where: { id: deviceId, ownerId: s.uid }, select: { id: true } })
    if (!own) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const cmd = await prisma.command.create({
      data: {
        deviceId,
        action,
        state: typeof state === "boolean" ? state : null,
        value: value ?? null,
      },
      select: { id: true },
    })

    if (action === "calibrate" && value?.lowThreshold != null) {
      await prisma.device.update({ where: { id: deviceId }, data: { threshold: Number(value.lowThreshold) } })
    }

    return NextResponse.json({ id: cmd.id, ok: true })
  } catch (e: any) {
    console.error("POST /api/actions error:", e)
    return NextResponse.json({ error: "server_error", message: e?.message }, { status: 500 })
  }
}
