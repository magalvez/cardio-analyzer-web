import JSZip from "jszip";

/**
 * Custom DOCX → HTML converter that preserves formatting
 * Reads the raw OOXML and extracts styles that mammoth strips out
 */
export async function convertDocxToStyledHtml(buffer: Buffer): Promise<string> {
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

export function prepareHtmlForDocx(html: string): string {
  // Trim excessive whitespace from start/end
  // Remove all newlines and carriage returns to prevent them from being interpreted as spaces
  // Also remove non-standard spaces like &nbsp; or zero-width characters at the very start
  let styled = html.replace(/[\n\r]/g, '').trim();
  styled = styled.replace(/^(&nbsp;|\s|\u00A0|&zwj;|&#8203;)+/gi, '');

  // Remove any whitespace between tags that could be interpreted as a space/paragraph
  styled = styled.replace(/>\s+</g, '><');

  // Aggressively remove ANY leading tag that contains no real text
  // We use a loop to handle nested or multiple empty tags (p, div, br, etc.)
  let lastStyled = "";
  while (styled !== lastStyled) {
    lastStyled = styled;
    styled = styled.trim();
    // Remove empty paragraphs, divs, headings, spans or breaks at the very beginning
    // Including those with non-breaking spaces, zero-width joiners, or multiple breaks
    styled = styled.replace(/^<(p|div|h[1-6]|span)[^>]*>([\s\u00A0\t\n\r]|&nbsp;|<br\s*\/?>|&zwj;|&#8203;)*<\/\1>/i, "");
    styled = styled.replace(/^<br\s*\/?>/i, "");
  }

  // Also clean up trailing empty elements
  lastStyled = "";
  while (styled !== lastStyled) {
    lastStyled = styled;
    styled = styled.trim();
    styled = styled.replace(/<(p|div|h[1-6]|span)[^>]*>([\s\u00A0\t\n\r]|&nbsp;|<br\s*\/?>|&zwj;|&#8203;)*<\/\1>$/i, "");
    styled = styled.replace(/<br\s*\/?>$/i, "");
  }

  // Force the very first tag to have absolutely zero top margin/padding
  // We must remove any existing margin-top first to avoid overrides
  styled = styled.replace(/^(<(p|div|table|h[1-6])[^>]*style=")([^"]*)margin-top:\s*[^;"]+;?/gi, '$1$3');
  styled = styled.replace(/^(<(p|div|table|h[1-6])[^>]*style=")([^"]*)padding-top:\s*[^;"]+;?/gi, '$1$3');
  styled = styled.replace(/^(<(p|div|table|h[1-6])[^>]*style=")/i, '$1margin-top:0pt;padding-top:0pt;');
  styled = styled.replace(/^(<(p|div|table|h[1-6])(?![^>]*style))/i, '$1 style="margin-top:0pt;padding-top:0pt;"');
  
  // 1. Convert h2/h3 followed by <hr> into a single tight table with border-bottom.
  // This is the only way to ensure 0px spacing between the text and the line in Word.
  styled = styled.replace(
    /<h(2|3)([^>]*)>([\s\S]*?)<\/h\1>\s*<hr\s*\/?>/gi,
    (_, level, attrs, content) => {
      const fontSize = level === '2' ? '12pt' : '11pt';
      const alignMatch = attrs.match(/style="([^"]*)"/)?.[1] || '';
      return `
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0; margin-top: 0pt; padding: 0;">
          <tr>
            <td style="font-family:Arial;color:#1F4E79;font-size:${fontSize};margin:0;padding:0;border-bottom: 2px solid #1F4E79;${alignMatch}">
              <strong>${content}</strong>
            </td>
          </tr>
        </table>
      `;
    }
  );

  // Remove empty spacer paragraphs that follow a table (like the header table)
  // to avoid unwanted gaps before the next section
  styled = styled.replace(/(<\/table>)\s*<p[^>]*>\s*(&nbsp;|<br\s*\/?>)?\s*<\/p>/gi, '$1');

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

  // Style the "NOTA:" disclaimer using italics and light gray (more flexible regex)
  styled = styled.replace(
    /(NOTA:[\s\S]*?)(?=<\/p>|$)/gi,
    '<span style="color:#7F7F7F;font-size:9pt;"><em>$1</em></span>'
  );

  // Style the content of REFERENCIAS (typically starts with a year or Guideline)
  styled = styled.replace(
    /((?:\d{4}\s+AHA\/ACC|Guideline)[\s\S]*?)(?=<\/p>|$)/gi,
    '<span style="color:#7F7F7F;font-size:9pt;">$1</span>'
  );

  // Add font-family and font-size to <p> tags without style
  styled = styled.replace(
    /<p(?![^>]*style)([^>]*)>/gi,
    '<p style="font-family:Arial;font-size:11pt;line-height:1.2;margin:0;margin-bottom:0pt;"$1>'
  );

  // Add font-family and font-size to <p> tags with style but no font-family
  styled = styled.replace(
    /<p([^>]*?)style="((?!font-family)[^"]*)"([^>]*)>/gi,
    '<p$1style="font-family:Arial;font-size:11pt;line-height:1.2;margin:0;margin-bottom:0pt;$2"$3>'
  );


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

  return styled;
}
