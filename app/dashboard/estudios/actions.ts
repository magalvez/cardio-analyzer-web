"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import HTMLToDOCX from "html-to-docx";

export async function getStudies(page = 1, pageSize = 10, search = "", filters: { status?: string, classification?: string } = {}) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const offset = (page - 1) * pageSize;
  
  const searchFilter = search 
    ? sql`AND (p.nombre_completo ILIKE ${'%' + search + '%'} OR p.cedula ILIKE ${'%' + search + '%'})` 
    : sql``;

  const statusFilter = filters.status 
    ? sql`AND e.estado = ${filters.status}`
    : sql``;

  const classFilter = filters.classification
    ? sql`AND r.clasificacion = ${filters.classification}`
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
      r.id as resultado_id
    FROM estudios e
    JOIN pacientes p ON e.paciente_id = p.id
    LEFT JOIN resultados_ia r ON e.id = r.estudio_id
    WHERE 1=1
    ${roleFilter}
    ${searchFilter}
    ${statusFilter}
    ${classFilter}
    ORDER BY e.recibido_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [totalResult] = await sql`
    SELECT count(*) 
    FROM estudios e
    JOIN pacientes p ON e.paciente_id = p.id
    LEFT JOIN resultados_ia r ON e.id = r.estudio_id
    WHERE 1=1
    ${roleFilter}
    ${searchFilter}
    ${statusFilter}
    ${classFilter}
  `;

  return {
    studies,
    total: parseInt(totalResult.count)
  };
}

export async function exportStudyWord(id: string, html?: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  let finalHtml = html;
  
  if (!finalHtml) {
    const [report] = await sql`SELECT informe_html FROM estudio_reportes WHERE estudio_id = ${id}`;
    finalHtml = report?.informe_html || "<p>Informe no disponible</p>";
  }

  const docBuffer = await HTMLToDOCX(finalHtml, null, {
    header: true,
    footer: true,
    pageNumber: true,
  });

  return docBuffer.toString('base64');
}
