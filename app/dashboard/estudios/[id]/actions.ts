"use server";
// Cache bust: 2026-04-20 17:23

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export interface StudyDetail {
  id: string;
  estado: string;
  paciente_id: string;
  patient_name: string;
  patient_id: string;
  patient_age: number;
  patient_sex: string;
  motivo_consulta: string;
  informe_html?: string;
  recibido_at: string;
  firmado_at?: string;
  results: any;
  imageUrls: string[];
  guia_usada?: string;
}

export async function getStudyDetail(id: string): Promise<StudyDetail | null> {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const [study] = await sql`
    SELECT 
      e.*, 
      e.motivo as motivo_consulta,
      p.nombre_completo as patient_name, 
      p.cedula as patient_id, 
      p.edad as patient_age, 
      p.sexo as patient_sex,
      rep.r2_key, rep.r2_url, rep.r2_key_editado, rep.r2_url_editado, rep.informe_html, rep.tipo,
      json_build_object(
        'clasificacion', r.clasificacion,
        'patron_circadiano', COALESCE(r.patron_dipper, '---'),
        'porcentaje_lecturas_validas', r.porcentaje_validas,
        'carga_tensional_pas', COALESCE(r.carga_pas_dia_pct::text || '%', '---'),
        'promedio_24h', CASE WHEN r.promedio_pas_general IS NOT NULL THEN (r.promedio_pas_general || '/' || r.promedio_pad_general) ELSE '---' END,
        'promedio_despierto', CASE WHEN r.promedio_pas_dia IS NOT NULL THEN (r.promedio_pas_dia || '/' || r.promedio_pad_dia) ELSE '---' END,
        'promedio_sueno', CASE WHEN r.promedio_pas_noche IS NOT NULL THEN (r.promedio_pas_noche || '/' || r.promedio_pad_noche) ELSE '---' END,
        'narrativa_analisis', COALESCE(r.resumen_gemini, 'Análisis en proceso...')
      ) as results
    FROM estudios e
    JOIN pacientes p ON e.paciente_id = p.id
    LEFT JOIN resultados_ia r ON e.id = r.estudio_id
    LEFT JOIN estudio_reportes rep ON e.id = rep.estudio_id
    WHERE e.id = ${id}
  `;

  if (!study) return null;

  // Authorization check
  if (session.rol !== 'admin' && study.medico_solicitante_id !== session.medico_id) {
    throw new Error("Unauthorized");
  }

  // Get Images R2 keys
  const images = await sql`
    SELECT r2_key_original 
    FROM estudio_imagenes 
    WHERE estudio_id = ${id} 
    ORDER BY indice ASC
  `;

  // Generate internal proxy URLs
  const imageUrls = images.map(img => `/api/images/${img.r2_key_original}`);

  return {
    ...(study as any),
    imageUrls: imageUrls
  } as StudyDetail;
}

export async function saveStudyReport(estudio_id: string, html: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  await sql`
    UPDATE estudio_reportes 
    SET informe_html = ${html},
        editado_at = now(),
        editado_por = ${session.id}
    WHERE estudio_id = ${estudio_id}
  `;

  return { success: true };
}

export async function approveStudy(estudio_id: string, html: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");
  
  // Important: Use medico_id for clinical signing, not user_id
  const medico_id = session.medico_id;
  if (!medico_id) throw new Error("Solo un médico puede firmar este estudio");

  await sql.begin(async (sql) => {
    await sql`
      UPDATE estudios 
      SET estado = 'firmado',
          firmado_at = now(),
          medico_firmante_id = ${medico_id}
      WHERE id = ${estudio_id}
    `;
    await sql`
      UPDATE estudio_reportes 
      SET informe_html = ${html},
          editado_at = now(),
          editado_por = ${session.id}
      WHERE estudio_id = ${estudio_id}
    `;
  });

  return { success: true };
}

