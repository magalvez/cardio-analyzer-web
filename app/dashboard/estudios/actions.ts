"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getStudies(page = 1, pageSize = 10, search = "") {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const offset = (page - 1) * pageSize;
  const whereSql = search 
    ? sql`AND (p.nombre_completo ILIKE ${'%' + search + '%'} OR p.cedula ILIKE ${'%' + search + '%'})` 
    : sql``;

  // Filter based on role
  const roleFilter = session.rol === 'admin' 
    ? sql`AND e.clinica_id = ${session.clinica_id}`
    : sql`AND e.medico_solicitante_id = ${session.medico_id}`;

  const studies = await sql`
    SELECT 
      e.id, 
      e.estado, 
      e.motivo as motivo_consulta,
      e.notas_medico, 
      e.aprobado_at,
      e.recibido_at,
      p.nombre_completo as patient, 
      p.cedula as id_number, 
      r.clasificacion, 
      r.promedio_pas_general, 
      r.promedio_pad_general,
      r.patron_dipper, 
      r.resumen_motor, 
      r.resumen_gemini,
      r.hipotension_detectada,
      r.hipotension_diurna_detectada, 
      r.hipotension_nocturna_detectada
    FROM estudios e
    JOIN pacientes p ON e.paciente_id = p.id
    LEFT JOIN resultados_ia r ON e.id = r.estudio_id
    WHERE 1=1
    ${roleFilter}
    ${whereSql}
    ORDER BY e.recibido_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [totalResult] = await sql`
    SELECT count(*) 
    FROM estudios e
    JOIN pacientes p ON e.paciente_id = p.id
    WHERE 1=1
    ${roleFilter}
    ${whereSql}
  `;

  return {
    studies,
    total: parseInt(totalResult.count)
  };
}
