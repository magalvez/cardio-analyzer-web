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
    const [report] = await sql`SELECT informe_html FROM estudio_reportes WHERE estudio_id = ${id}`;
    finalHtml = report?.informe_html || "<p>Informe no disponible</p>";
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

/**
 * Transforms TipTap editor HTML into styled HTML that html-to-docx can render.
 * Uses inline styles to avoid corrupting the DOCX output.
 */
function prepareHtmlForDocx(html: string): string {
  // Ultra-aggressive trim to remove ANY leading empty tags, spaces, or breaks
  let styled = html.trim()
    .replace(/^(<p[^>]*>[\s\n\r&nbsp;|<br\s*\/?>]*<\/p>|<br\s*\/?>|&nbsp;|\s)+/gi, '')
    .trim();

  // Force the very first tag to have absolutely zero top margin/padding
  styled = styled.replace(/^(<(p|table|h[1-6])[^>]*style=")/i, '$1margin-top:0pt;padding-top:0pt;');
  styled = styled.replace(/^(<(p|table|h[1-6])(?![^>]*style))/i, '$1 style="margin-top:0pt;padding-top:0pt;"');

  // 1. Convert h2/h3 followed by <hr> into a single tight table with border-bottom.
  // This is the only way to ensure 0px spacing between the text and the line in Word.
  styled = styled.replace(
    /<h(2|3)([^>]*)>([\s\S]*?)<\/h\1>\s*<hr\s*\/?>/gi,
    (_, level, attrs, content) => {
      const isSignature = content.toLowerCase().includes('dr.');
      const isConclusion = content.toLowerCase().includes('conclusión');
      const isReferences = content.toLowerCase().includes('referencias');
      
      let spacingRows = '';
      if (isConclusion || isReferences) {
        spacingRows = '<tr><td style="font-size:11pt;line-height:11pt;">&nbsp;</td></tr>';
      } else if (isSignature) {
        // Signatures usually need more space
        spacingRows = '<tr><td style="font-size:11pt;line-height:11pt;">&nbsp;</td></tr><tr><td style="font-size:11pt;line-height:11pt;">&nbsp;</td></tr>';
      }

      const fontSize = level === '2' ? '12pt' : '11pt';
      const alignMatch = attrs.match(/style="([^"]*)"/)?.[1] || '';
      return `
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0; margin-top: 0pt; padding: 0;">
          ${spacingRows}
          <tr>
            <td style="font-family:Arial;color:#1F4E79;font-size:${fontSize};margin:0;padding:0;border-bottom: 2px solid #1F4E79;${alignMatch}">
              <strong>${content}</strong>
            </td>
          </tr>
        </table>
      `;
    }
  );

  // 2. Convert remaining h2 headings to styled paragraphs
  styled = styled.replace(
    /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
    (_, attrs, content) => {
      const alignMatch = attrs.match(/style="([^"]*)"/)?.[1] || '';
      const style = `font-family:Arial;color:#1F4E79;font-size:12pt;margin:0;margin-bottom:0pt;${alignMatch}`;
      return `<p style="${style}"><strong>${content}</strong></p>`;
    }
  );

  // 3. Convert remaining h3 headings to styled paragraphs
  styled = styled.replace(
    /<h3([^>]*)>([\s\S]*?)<\/h3>/gi,
    (_, attrs, content) => {
      const alignMatch = attrs.match(/style="([^"]*)"/)?.[1] || '';
      const style = `font-family:Arial;color:#1F4E79;font-size:11pt;margin:0;margin-bottom:0pt;${alignMatch}`;
      return `<p style="${style}"><strong>${content}</strong></p>`;
    }
  );

  // Style the "NOTA: **" disclaimer using italics (as seen in image)
  styled = styled.replace(
    /NOTA:\s*\*\*(.*?)\*\*/g,
    '<em>NOTA: $1</em>'
  );

  // Add font-family and font-size to <p> tags without style
  styled = styled.replace(
    /<p(?![^>]*style)([^>]*)>/gi,
    '<p style="font-family:Arial;font-size:11pt;margin:0;margin-bottom:0pt;"$1>'
  );

  // Add font-family and font-size to <p> tags with style but no font-family
  styled = styled.replace(
    /<p([^>]*?)style="((?!font-family)[^"]*)"([^>]*)>/gi,
    '<p$1style="font-family:Arial;font-size:11pt;margin:0;margin-bottom:0pt;$2"$3>'
  );

  // Remove empty spacer paragraphs that just have &nbsp; or <br>
  styled = styled.replace(/<p[^>]*>\s*(&nbsp;|<br\s*\/?>)\s*<\/p>/gi, '');

  // 4. Replace standalone <hr> with a safe tight table-based horizontal line.
  const hrReplacement = `
    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
      <tbody>
        <tr>
          <td style="border-bottom: 2px solid #1F4E79; padding: 0; margin: 0; font-size: 1pt; line-height: 1pt;">&nbsp;</td>
        </tr>
      </tbody>
    </table>
  `;
  styled = styled.replace(/<hr\s*\/?>/gi, hrReplacement);

  // 5. Manual Spacing Adjustments
  // Add 1 line break before "NOTA:" - handles tags like <strong> or <span> before the text
  styled = styled.replace(
    /(?:<p[^>]*>)?\s*(?:<[^>]+>)*\s*NOTA:/gi,
    '<p style="margin:0;font-size:11pt;line-height:11pt;">&nbsp;</p>$&'
  );

  // Add 2 line breaks before the doctor's signature - handles tags like <strong> or <span>
  styled = styled.replace(
    /(?:<p[^>]*>)?\s*(?:<[^>]+>)*\s*Dr\.\s*JUAN\s*RAMON/gi,
    '<p style="margin:0;font-size:11pt;line-height:11pt;">&nbsp;</p><p style="margin:0;font-size:11pt;line-height:11pt;">&nbsp;</p>$&'
  );

  // Final aggressive trim to remove any spaces or breaks at the very beginning
  styled = styled.trim().replace(/^(\s|&nbsp;|<br\s*\/?>|<p[^>]*>\s*(&nbsp;|<br\s*\/?>)?\s*<\/p>)*/gi, '');

  return styled;
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
