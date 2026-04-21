import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "mapa-cardio-secret";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(user: { 
  id: string; 
  email: string; 
  rol: string; 
  clinica_id: string; 
  medico_id: string | null; 
  requiere_reset: boolean;
  nombre_completo?: string | null;
  especialidad?: string | null;
}) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const sessionData = { ...user, user_id: user.id };
  const session = await encrypt(sessionData);

  (await cookies()).set("session", session, { expires, httpOnly: true, secure: process.env.NODE_ENV === "production" });
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
