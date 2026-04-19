"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getDoctors() {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  const doctors = await sql`
    SELECT 
      u.id, 
      u.email, 
      u.rol, 
      u.activo,
      m.nombre_completo as name,
      m.especialidad as specialty,
      (SELECT count(*) FROM estudios WHERE medico_id = m.id) as studies_count
    FROM usuarios u
    LEFT JOIN medicos m ON u.medico_id = m.id
    WHERE u.clinica_id = ${session.clinica_id}
    ORDER BY u.rol DESC, m.nombre_completo ASC
  `;

  return doctors;
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const session = await getSession();
    if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

    await sql`UPDATE usuarios SET activo = ${!currentStatus}, updated_at = now() WHERE id = ${userId}`;
    
    return { success: true };
}
