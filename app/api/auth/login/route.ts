import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "missing_fields" }, { status: 400 })

    const u = await prisma.user.findUnique({ where: { email } })
    if (!u) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })

    const ok = await bcrypt.compare(password, u.passwordHash)
    if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })

    await createSession({ uid: u.id, email: u.email, name: u.name })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("login error:", e)
    return NextResponse.json({ error: "server_error", message: e?.message || "unknown" }, { status: 500 })
  }
}
