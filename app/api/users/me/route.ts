import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const s = await getSession()
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  return NextResponse.json({ uid: s.uid, email: s.email, name: s.name || null })
}
