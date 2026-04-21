"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import HTMLToDOCX from "html-to-docx";

export async function getDashboardStats(days: number = 14) {
  try {
    const session = await getSession();
    if (!session) throw new Error("No session");

    const roleFilter = session.rol === 'admin'
      ? sql`AND clinica_id = ${session.clinica_id}`
      : sql`AND medico_solicitante_id = ${session.medico_id}`;

    // Parallel execution of all data requirements
    const [countsResult, distributionResult, volumeResult, prevCountsResult, clinicResult] = await Promise.all([
      // 1. Core KPIs
      sql`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE estado IN ('revision', 'completado', 'procesando', 'recibido')) as pendientes,
          count(*) FILTER (WHERE estado = 'firmado') as aprobados
        FROM estudios
        WHERE 1=1 ${roleFilter}
      `,
      // 2. Classification Distribution (inclusive of zero values)
      sql`
        WITH categories AS (
          SELECT 'normal' as clasificacion, 'Normal' as label UNION ALL
          SELECT 'elevada', 'PA Elevada' UNION ALL
          SELECT 'anormal', 'HTA Confirmada'
        )
        SELECT 
          c.clasificacion,
          c.label,
          COALESCE(count(r.id), 0) as count,
          COALESCE(round(count(r.id) * 100.0 / NULLIF(SUM(count(r.id)) OVER(), 0), 1), 0) as percentage
        FROM categories c
        LEFT JOIN resultados_ia r ON c.clasificacion = r.clasificacion
        LEFT JOIN estudios e ON e.id = r.estudio_id AND (
          ${session.rol === 'admin'
          ? sql`e.clinica_id = ${session.clinica_id}`
          : sql`e.medico_solicitante_id = ${session.medico_id}`}
        )
        GROUP BY c.clasificacion, c.label
        ORDER BY 
          CASE c.clasificacion 
            WHEN 'normal' THEN 1 
            WHEN 'elevada' THEN 2 
            WHEN 'anormal' THEN 3 
          END
      `,
      // 3. Volume Chart
      sql`
        SELECT 
          recibido_at::date as day,
          count(*) as total
        FROM estudios
        WHERE recibido_at >= now() - (interval '1 day' * ${days})
        ${roleFilter}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      // 4. Previous Period Counts
      sql`
        SELECT count(*) as total
        FROM estudios
        WHERE recibido_at >= now() - (interval '1 day' * ${days * 2})
        AND recibido_at < now() - (interval '1 day' * ${days})
        ${roleFilter}
      `,
      // 5. Clinic Data
      sql`SELECT nombre FROM clinicas WHERE id = ${session.clinica_id}`
    ]);

    const counts = countsResult[0] || { total: 0, pendientes: 0, aprobados: 0 };
    const prevCounts = prevCountsResult[0] || { total: 0 };
    
    // Process total change
    const totalActual = parseInt(counts.total);
    const totalPrev = parseInt(prevCounts.total);
    let totalChange = 0;
    if (totalPrev > 0) {
      totalChange = parseFloat(((totalActual - totalPrev) / totalPrev * 100).toFixed(1));
    } else if (totalActual > 0) {
      totalChange = 100;
    }

    const distribution = distributionResult || [];

    // Fill missing days
    const chartData: any[] = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      
      const match = volumeResult.find((r: any) => {
         const rDate = new Date(r.day);
         return rDate.getUTCDate() === d.getDate() && 
                rDate.getUTCMonth() === d.getMonth() && 
                rDate.getUTCFullYear() === d.getFullYear();
      });

      chartData.push({
        date: dateStr,
        total: match ? parseInt(match.total) : 0,
        forecast: null
      });
    }

    // Add forecast
    const lastPoint = chartData[chartData.length - 1];
    if (lastPoint) {
      const baseVal = lastPoint.total;
      chartData.push({ date: "Próx. 24h", total: null, forecast: baseVal + 2 });
      chartData.push({ date: "Próx. 48h", total: null, forecast: baseVal + 5 });
      lastPoint.forecast = lastPoint.total;
    }

    return {
      kpis: {
        total: totalActual,
        pendientes: parseInt(counts.pendientes),
        aprobados: parseInt(counts.aprobados),
        change: totalChange >= 0 ? `+${totalChange}%` : `${totalChange}%`
      },
      distribution: distribution,
      volumeData: chartData
    };
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return {
      kpis: { total: 0, pendientes: 0, aprobados: 0 },
      distribution: [],
      volumeData: []
    };
  }
}

export async function exportAnnualReport() {
  try {
    const session = await getSession();
    if (!session) throw new Error("No session");

    const [clinic] = await sql`SELECT nombre FROM clinicas WHERE id = ${session.clinica_id}`;
    const stats = await getDashboardStats();

    const year = new Date().getFullYear();
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h1 style="text-align: center; color: #1d4ed8; font-size: 24pt;">Informe de Gestión Clínica MAPA</h1>
        <h2 style="text-align: center; color: #64748b; font-size: 16pt;">${clinic?.nombre || 'Clínica General'}</h2>
        <p style="text-align: center;">Periodo: Enero ${year} - Diciembre ${year}</p>
        <p style="text-align: center; font-size: 10pt; color: #94a3b8;">Fecha de generación: ${date}</p>
        
        <hr style="border: 0.5pt solid #e2e8f0; margin: 40px 0;"/>
        
        <h3 style="color: #1e40af; border-bottom: 2pt solid #3b82f6; padding-bottom: 5px;">1. Resumen Operativo</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 15px; border: 1pt solid #f1f5f9; background-color: #f8fafc; text-align: center;">
              <div style="font-size: 10pt; color: #64748b; font-weight: bold;">TOTAL ESTUDIOS</div>
              <div style="font-size: 20pt; font-weight: bold; color: #1e293b;">${stats.kpis.total}</div>
            </td>
            <td style="padding: 15px; border: 1pt solid #f1f5f9; background-color: #f8fafc; text-align: center;">
              <div style="font-size: 10pt; color: #64748b; font-weight: bold;">PENDIENTES</div>
              <div style="font-size: 20pt; font-weight: bold; color: #d97706;">${stats.kpis.pendientes}</div>
            </td>
            <td style="padding: 15px; border: 1pt solid #f1f5f9; background-color: #f8fafc; text-align: center;">
              <div style="font-size: 10pt; color: #64748b; font-weight: bold;">APROBADOS</div>
              <div style="font-size: 20pt; font-weight: bold; color: #059669;">${stats.kpis.aprobados}</div>
            </td>
          </tr>
        </table>

        <h3 style="color: #1e40af; border-bottom: 2pt solid #3b82f6; padding-bottom: 5px; margin-top: 40px;">2. Distribución de Diagnósticos</h3>
        <p style="font-size: 11pt; color: #475569;">A continuación se detalla la clasificación clínica de los estudios procesados durante el periodo:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #1e293b; color: white;">
              <th style="padding: 12px; text-align: left; border: 1pt solid #1e293b;">Clasificación Clínica</th>
              <th style="padding: 12px; text-align: center; border: 1pt solid #1e293b;">Cantidad</th>
              <th style="padding: 12px; text-align: center; border: 1pt solid #1e293b;">Porcentaje (%)</th>
            </tr>
          </thead>
          <tbody>
            ${stats.distribution.map((dist: any) => `
              <tr>
                <td style="padding: 12px; border: 1pt solid #e2e8f0; font-weight: bold;">${dist.label}</td>
                <td style="padding: 12px; border: 1pt solid #e2e8f0; text-align: center;">${dist.count}</td>
                <td style="padding: 12px; border: 1pt solid #e2e8f0; text-align: center; color: #3b82f6; font-weight: bold;">${dist.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 100px; text-align: center; border-top: 1pt solid #e2e8f0; padding-top: 20px;">
          <p style="font-size: 9pt; color: #94a3b8;">Este documento es un reporte estadístico generado por el sistema CARDIO Analyzer.</p>
          <p style="font-size: 9pt; color: #94a3b8;">&copy; ${year} Cardio Analyzer Labs. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const docBuffer = await HTMLToDOCX(html, null, {
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch
      header: true,
      footer: true,
      pageNumber: true,
    });

    return docBuffer.toString('base64');
  } catch (error) {
    console.error("Annual Report Error:", error);
    throw error;
  }
}
