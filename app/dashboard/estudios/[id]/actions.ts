"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import HTMLToDOCX from "html-to-docx";

export async function getStudyDetail(id: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const [study] = await sql`
    SELECT 
      e.*, 
      e.motivo as motivo_consulta,
      p.nombre_completo as patient_name, p.cedula as patient_id, p.edad as patient_age, p.sexo as patient_sex,
      r.* as results,
      rep.r2_key, rep.r2_url, rep.r2_key_editado, rep.r2_url_editado, rep.informe_html, rep.tipo
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
    ORDER BY orden ASC
  `;

  // Generate presigned URLs via Cloudflare Worker
  const imageUrls = await Promise.all(images.map(async (img) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL}/presign?key=${img.r2_key_original}`, {
      headers: { 'Authorization': `Bearer ${process.env.CLOUDFLARE_WORKER_API_KEY}` }
    });
    const data = await res.json();
    return data.url;
  }));

  return {
    ...study,
    imageUrls
  };
}

export async function saveStudyReport(estudio_id: string, html: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  await sql`
    UPDATE estudio_reportes 
    SET informe_html = ${html},
        editado_at = now(),
        editado_por = ${session.user_id}
    WHERE estudio_id = ${estudio_id}
  `;

  return { success: true };
}

export async function approveStudy(estudio_id: string, html: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  await sql.begin(async (sql) => {
    await sql`
      UPDATE estudios 
      SET estado = 'aprobado',
          aprobado_at = now(),
          aprobado_por = ${session.user_id}
      WHERE id = ${estudio_id}
    `;
    await sql`
      UPDATE estudio_reportes 
      SET informe_html = ${html},
          editado_at = now(),
          editado_por = ${session.user_id}
      WHERE estudio_id = ${estudio_id}
    `;
  });

  return { success: true };
}

export async function exportStudyWord(id: string, html: string) {
  const session = await getSession();
  if (!session) throw new Error("No session");

  const docBuffer = await HTMLToDOCX(html, null, {
    header: true,
    footer: true,
    pageNumber: true,
  });

  return docBuffer.toString('base64');
}
