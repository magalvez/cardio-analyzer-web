"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getPatients(page = 1, pageSize = 10, search = "", filters: { classification?: string } = {}) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const offset = (page - 1) * pageSize;

  const searchFilter = search 
    ? sql`AND (p.nombre_completo ILIKE ${'%' + search + '%'} OR p.cedula ILIKE ${'%' + search + '%'})` 
    : sql``;

  const classFilter = filters.classification
    ? sql`AND agg.clasificacion_reciente = ${filters.classification}`
    : sql``;

  const patients = await sql`
    SELECT * FROM (
      SELECT 
        p.*,
        COALESCE(agg.total_estudios, 0) as total_estudios,
        agg.ultimo_estudio,
        agg.ultimo_estudio_id,
        agg.clasificacion_reciente
      FROM pacientes p
      LEFT JOIN (
        SELECT 
          e.paciente_id,
          count(e.id) as total_estudios,
          max(e.recibido_at) as ultimo_estudio,
          (array_agg(e.id ORDER BY e.recibido_at DESC))[1] as ultimo_estudio_id,
          (array_agg(r.clasificacion ORDER BY e.recibido_at DESC))[1] as clasificacion_reciente
        FROM estudios e
        LEFT JOIN resultados_ia r ON e.id = r.estudio_id
        GROUP BY e.paciente_id
      ) agg ON p.id = agg.paciente_id
      WHERE p.clinica_id = ${session.clinica_id}
      ${searchFilter}
    ) agg
    WHERE 1=1
    ${classFilter}
    ORDER BY nombre_completo ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [totalResult] = await sql`
     SELECT count(*) FROM (
      SELECT p.id
      FROM pacientes p
      LEFT JOIN (
        SELECT 
          e.paciente_id,
          (array_agg(r.clasificacion ORDER BY e.recibido_at DESC))[1] as clasificacion_reciente
        FROM estudios e
        LEFT JOIN resultados_ia r ON e.id = r.estudio_id
        GROUP BY e.paciente_id
      ) agg ON p.id = agg.paciente_id
      WHERE p.clinica_id = ${session.clinica_id}
      ${searchFilter}
      ${classFilter}
    ) t
  `;

  return {
    patients,
    total: parseInt(totalResult.count)
  };
}
