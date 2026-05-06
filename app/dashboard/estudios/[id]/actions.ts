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

import { convertDocxToStyledHtml, prepareHtmlForDocx } from "@/lib/report-utils";
import HTMLtoDOCX from 'html-to-docx';

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

  // R2 Document Loading Strategy:
  // - If user has edited before (informe_html exists in DB), use it directly
  //   to preserve TipTap formatting. The R2 DOCX is only for download/export.
  // - If no edits yet, convert the original DOCX from R2 to styled HTML.
  const hasEditedHtml = study.informe_html && study.informe_html.trim().length > 0;

  if (!hasEditedHtml) {
    const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
    const API_KEY = process.env.CLOUDFLARE_WORKER_API_KEY;
    console.log("[R2] No edited HTML in DB, fetching original from R2");

    if (WORKER_URL && API_KEY && study.r2_key) {
      try {
        const key = study.r2_key.replace(/^\//, '');
        const fetchUrl = `${WORKER_URL}?key=${key}`;
        const response = await fetch(fetchUrl, {
          headers: { Authorization: `Bearer ${API_KEY}` }
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const html = await convertDocxToStyledHtml(buffer);
          if (html && html.length > 0) {
            study.informe_html = html;
            console.log("[R2] SUCCESS - HTML set from R2 conversion, length:", html.length);
          }
        } else {
          console.error("[R2] Fetch failed:", response.status);
        }
      } catch (err) {
        console.error("[R2] Error:", err);
      }
    }
  } else {
    console.log("[R2] Using existing edited HTML from DB, length:", study.informe_html.length);
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



async function syncHTMLToR2(estudio_id: string, html: string, user_id: string, sqlClient: any = sql) {
  const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
  const API_KEY = process.env.CLOUDFLARE_WORKER_API_KEY;

  if (!WORKER_URL || !API_KEY) return;

  const [report] = await sqlClient`
    SELECT r2_key, r2_key_editado 
    FROM estudio_reportes 
    WHERE estudio_id = ${estudio_id} AND tipo = 'informe_word'
  `;

  if (!report || !report.r2_key) return;

  const targetKey = report.r2_key_editado || report.r2_key.replace('.docx', '_edited.docx');

  try {
    // Preprocess HTML to inject inline styles that html-to-docx understands
    const styledHtml = prepareHtmlForDocx(html);

    const fileBuffer = await HTMLtoDOCX(styledHtml, null, {
      table: { row: { cantSplit: true } },
      font: 'Arial',
      fontSize: 22, // 11pt in half-points
      margins: {
        top: 0,
        right: 720,
        bottom: 720,
        left: 720,
        header: 0,
        footer: 720,
        gutter: 0
      }
    });

    const response = await fetch(`${WORKER_URL}/${targetKey}`, {
      method: 'PUT',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      body: fileBuffer as any
    });

    if (response.ok) {
      await sqlClient`
        UPDATE estudio_reportes 
        SET r2_key_editado = ${targetKey},
            editado_at = now(),
            editado_por = ${user_id}
        WHERE estudio_id = ${estudio_id} AND tipo = 'informe_word'
      `;
    } else {
      console.error("Failed to upload to R2:", await response.text());
    }
  } catch (error) {
    console.error("Error during R2 sync:", error);
  }
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

  await syncHTMLToR2(estudio_id, html, session.id);

  return { success: true };
}

export async function approveStudy(estudio_id: string, html: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  // Important: Use medico_id for clinical signing, not user_id
  const medico_id = session.medico_id;
  if (!medico_id) throw new Error("Solo un médico puede firmar este estudio");

  await sql.begin(async (tx) => {
    await tx`
      UPDATE estudios 
      SET estado = 'firmado',
          firmado_at = now(),
          medico_firmante_id = ${medico_id}
      WHERE id = ${estudio_id}
    `;
    await tx`
      UPDATE estudio_reportes 
      SET informe_html = ${html},
          editado_at = now(),
          editado_por = ${session.id}
      WHERE estudio_id = ${estudio_id}
    `;

    // Attempt R2 sync inside transaction
    await syncHTMLToR2(estudio_id, html, session.id, tx);
  });

  return { success: true };
}


