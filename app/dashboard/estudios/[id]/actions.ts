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

import JSZip from "jszip";

/**
 * Custom DOCX → HTML converter that preserves formatting
 * Reads the raw OOXML and extracts styles that mammoth strips out
 */
async function convertDocxToStyledHtml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");

  if (!docXml) return "";

  const htmlParts: string[] = [];

  // Parse paragraphs: <w:p>...</w:p>
  const paragraphs = docXml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];

  for (const para of paragraphs) {
    // Extract paragraph properties
    const pPr = para.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] || "";

    // Alignment
    const alignment = pPr.match(/w:jc w:val="([^"]+)"/)?.[1];

    // Border bottom (used as separator)
    const hasBorderBottom = /<w:bottom\s/.test(pPr);

    // Spacing (before and after)
    const spacingAfter = pPr.match(/w:after="(\d+)"/)?.[1];
    const spacingBefore = pPr.match(/w:before="(\d+)"/)?.[1];

    // Extract runs: <w:r>...</w:r>
    const runs = para.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || [];

    let paragraphContent = "";
    let paragraphFontSize = "";
    let paragraphColor = "";
    let isBoldParagraph = false;

    for (const run of runs) {
      const rPr = run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || "";
      const text = (run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
        .map(t => t.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
        .join("");

      if (!text) continue;

      // Run formatting
      const isBold = /<w:b\/?>/.test(rPr) && !(/w:val="false"/.test(rPr.match(/<w:b[^/]*?\/>/)?.[0] || ""));
      const isItalic = /<w:i\/?>/.test(rPr) && !(/w:val="false"/.test(rPr.match(/<w:i[^/]*?\/>/)?.[0] || ""));
      const isUnderline = /<w:u\s/.test(rPr);
      const color = rPr.match(/w:color w:val="([^"]+)"/)?.[1];
      const fontSize = rPr.match(/w:sz w:val="(\d+)"/)?.[1];
      const isCaps = /<w:caps\/>/.test(rPr);

      if (fontSize) paragraphFontSize = fontSize;
      if (color) paragraphColor = color;
      if (isBold) isBoldParagraph = true;

      // Build inline styles for this run
      let styles: string[] = [];
      if (color && color !== "000000") styles.push(`color:#${color}`);
      if (fontSize) {
        const ptSize = parseInt(fontSize) / 2;
        styles.push(`font-size:${ptSize}pt`);
      }

      let escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      if (isCaps) escapedText = escapedText.toUpperCase();

      // Strip decorative ** markers from beginning/end of runs
      // (keeps ** when embedded mid-text like in the NOTA disclaimer)
      escapedText = escapedText.replace(/^\*\*\s*$/g, "").replace(/^\*\*\s+/, "").replace(/\s*\*\*$/gm, "");

      let formattedText = escapedText;
      if (isBold) formattedText = `<strong>${formattedText}</strong>`;
      if (isItalic) formattedText = `<em>${formattedText}</em>`;
      if (isUnderline) formattedText = `<u>${formattedText}</u>`;

      if (styles.length > 0) {
        formattedText = `<span style="${styles.join(";")}">${formattedText}</span>`;
      }

      paragraphContent += formattedText;
    }

    // Check if paragraph has visible text content
    const trimmed = paragraphContent.replace(/<[^>]*>/g, "").trim();

    // Skip standalone ** markers (but keep them when embedded in longer text like NOTA)
    if (trimmed === "**") continue;

    // Empty paragraphs with large spacing serve as vertical spacers in Word
    if (!trimmed && !hasBorderBottom) {
      const afterVal = spacingAfter ? parseInt(spacingAfter) : 0;
      if (afterVal >= 160) {
        const spacerPx = Math.round(afterVal / 20 * 1.33);
        htmlParts.push(`<p style="margin-bottom:${spacerPx}px">&nbsp;</p>`);
      }
      continue;
    }

    // Build paragraph styles
    const pStyles: string[] = [];
    if (alignment === "center") pStyles.push("text-align:center");
    else if (alignment === "both") pStyles.push("text-align:justify");
    else if (alignment === "right") pStyles.push("text-align:right");

    if (spacingBefore) {
      const marginTopPx = Math.round(parseInt(spacingBefore) / 20 * 1.33);
      if (marginTopPx > 5) pStyles.push(`margin-top:${marginTopPx}px`);
    }
    if (spacingAfter) {
      const marginBottomPx = Math.round(parseInt(spacingAfter) / 20 * 1.33);
      if (marginBottomPx > 5) pStyles.push(`margin-bottom:${marginBottomPx}px`);
    }

    // Determine tag
    let tag = "p";
    const fontSizeNum = paragraphFontSize ? parseInt(paragraphFontSize) / 2 : 0;
    if (fontSizeNum >= 13 && isBoldParagraph) tag = "h2";
    else if (fontSizeNum >= 12 && isBoldParagraph) tag = "h3";

    // Add separator border: use <hr> after heading since TipTap strips inline border styles
    if (hasBorderBottom && !trimmed) {
      htmlParts.push(`<hr />`);
      continue;
    }
    const addHrAfter = hasBorderBottom;

    const styleAttr = pStyles.length > 0 ? ` style="${pStyles.join(";")}"` : "";
    htmlParts.push(`<${tag}${styleAttr}>${paragraphContent}</${tag}>`);
    if (addHrAfter) {
      htmlParts.push(`<hr />`);
    }
  }

  return htmlParts.join("\n");
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
        const fetchUrl = `${WORKER_URL}?key=${study.r2_key}`;
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

import HTMLtoDOCX from 'html-to-docx';

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


