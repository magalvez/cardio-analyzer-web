"use server";

import bcrypt from "bcryptjs";
import sql from "@/lib/db";
import { getSession, login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function resetPassword(password: string) {
  const session = await getSession();
  if (!session) throw new Error("No session found");

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await sql`
      UPDATE usuarios 
      SET password_hash = ${hashedPassword}, 
          requiere_reset = FALSE,
          updated_at = now()
      WHERE id = ${session.user_id}
    `;

    // Logout and redirect to login to ensure fresh state
    await logout();
    return { success: true };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { success: false, error: "No se pudo actualizar la contraseña" };
  }
}
