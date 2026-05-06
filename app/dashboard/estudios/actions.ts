"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import HTMLToDOCX from "html-to-docx";
import { prepareHtmlForDocx, convertDocxToStyledHtml } from "@/lib/report-utils";

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

  // Parallel execution of data fetch and count
  const [studies, totalResult] = await Promise.all([
    sql`
      SELECT 
        e.id, 
        e.estado, 
        e.motivo as motivo_consulta,
        e.recibido_at,
        p.nombre_completo as patient, 
        p.cedula as id_number, 
        r.clasificacion
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
    `,
    sql`
      SELECT count(*) 
      FROM estudios e
      JOIN pacientes p ON e.paciente_id = p.id
      ${filters.classification ? sql`LEFT JOIN resultados_ia r ON e.id = r.estudio_id` : sql``}
      WHERE 1=1
      ${roleFilter}
      ${searchFilter}
      ${statusFilter}
      ${classFilter}
    `
  ]);

  return {
    studies,
    total: parseInt(totalResult[0]?.count || "0")
  };
}

export async function exportStudyWord(id: string, html?: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  let finalHtml = html;
  
  if (!finalHtml) {
    // Try to find the word report specifically, but fallback to any report with an R2 key if not found
    const [report] = await sql`
      SELECT informe_html, r2_key, r2_url 
      FROM estudio_reportes 
      WHERE estudio_id = ${id} 
      ORDER BY (tipo = 'informe_word') DESC, created_at DESC 
      LIMIT 1
    `;
    
    if (report?.informe_html && report.informe_html.trim().length > 0) {
      finalHtml = report.informe_html;
    } else {
      let rawKey = report?.r2_key;
      if (!rawKey && report?.r2_url) {
        try {
          rawKey = new URL(report.r2_url).pathname;
        } catch (e) {
          rawKey = report.r2_url;
        }
      }
      
      const key = rawKey?.replace(/^\//, ''); // Ensure no leading slash
      
      if (key) {
        const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
        const API_KEY = process.env.CLOUDFLARE_WORKER_API_KEY;
        
        if (WORKER_URL && API_KEY) {
          try {
            console.log(`[Export] Fetching original from R2. Key: ${key}`);
            const response = await fetch(`${WORKER_URL}?key=${key}`, {
              headers: { Authorization: `Bearer ${API_KEY}` }
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              finalHtml = await convertDocxToStyledHtml(buffer);
            } else {
              console.error(`[Export] R2 Fetch failed: ${response.status} ${response.statusText}`);
            }
          } catch (err) {
            console.error("[Export] Error fetching original from R2:", err);
          }
        }
      }
    }

    if (!finalHtml || finalHtml.trim().length === 0) {
      console.warn(`[Export] No report content found for study ${id}`);
      finalHtml = "<p>Informe no disponible</p>";
    }
  }

  // Preprocess HTML to inject inline styles for DOCX generation
  const styledHtml = prepareHtmlForDocx(finalHtml!);

  const docBuffer = await HTMLToDOCX(styledHtml, null, {
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

  const buf = Buffer.isBuffer(docBuffer) ? docBuffer : Buffer.from(docBuffer);
  return buf.toString('base64');
}

export async function signStudy(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const roleCondition = session.rol === 'admin' 
    ? sql`AND clinica_id = ${session.clinica_id}`
    : sql`AND medico_solicitante_id = ${session.medico_id}`;

  await sql`
    UPDATE estudios 
    SET 
      estado = 'firmado',
      firmado_at = now()
    WHERE id = ${id} 
    ${roleCondition}
  `;
  
  return { success: true };
}
