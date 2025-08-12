import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "missing_fields" }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "email_taken" }, { status: 409 })

    const hash = await bcrypt.hash(password, 10)
    const u = await prisma.user.create({
      data: { name: name || null, email, passwordHash: hash, fcmTokens: [] },
      select: { id: true, name: true, email: true },
    })
    await createSession({ uid: u.id, email: u.email, name: u.name })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("signup error:", e)
    return NextResponse.json({ error: "server_error", message: e?.message || "unknown" }, { status: 500 })
  }
}
