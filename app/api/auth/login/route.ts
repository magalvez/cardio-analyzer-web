import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "@/lib/db";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    // Development Bypass / Demo User
    // if (process.env.NODE_ENV === "development" && email === "admin@mapacardio.com" && password === "admin123") {
    //   await login({
    //     id: "demo-admin",
    //     email: "admin@mapacardio.com",
    //     rol: "admin",
    //     clinica_id: "demo-clinic",
    //     medico_id: null,
    //   });
    //   return NextResponse.json({ success: true, user: { email: "admin@mapacardio.com", rol: "admin" } });
    // }

    const [user] = await sql`
      SELECT id, email, password_hash, rol, clinica_id, medico_id, activo 
      FROM usuarios 
      WHERE email = ${email} 
      LIMIT 1
    `;

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    if (!user.activo) {
      return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    await login({
      id: user.id,
      email: user.email,
      rol: user.rol,
      clinica_id: user.clinica_id,
      medico_id: user.medico_id,
    });

    return NextResponse.json({ success: true, user: { email: user.email, rol: user.rol } });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
