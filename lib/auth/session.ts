import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "spc_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const s =
    process.env.STACK_SECRET_SERVER_KEY ||
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET;
  if (!s)
    throw new Error(
      "Missing auth secret. Set STACK_SECRET_SERVER_KEY or AUTH_SECRET."
    );
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  uid: string;
  email: string;
  name?: string | null;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
