"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getPatients(search = "") {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const patients = await sql`
    SELECT 
      p.*,
      count(e.id) as total_estudios,
      max(e.created_at) as ultimo_estudio,
      (SELECT r.clasificacion FROM estudios e2 JOIN resultados_ia r ON e2.id = r.estudio_id WHERE e2.paciente_id = p.id ORDER BY e2.created_at DESC LIMIT 1) as clasificacion_reciente
    FROM pacientes p
    LEFT JOIN estudios e ON p.id = e.paciente_id
    WHERE p.clinica_id = ${session.clinica_id}
    ${search ? sql`AND (p.nombre_completo ILIKE ${'%' + search + '%'} OR p.cedula ILIKE ${'%' + search + '%'})` : sql``}
    GROUP BY p.id
    ORDER BY p.nombre_completo ASC
  `;

  return patients;
}
