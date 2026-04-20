"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getDashboardStats() {
  try {
    const session = await getSession();
    if (!session) throw new Error("No session");

    const roleFilter = session.rol === 'admin' 
      ? sql`AND clinica_id = ${session.clinica_id}`
      : sql`AND medico_solicitante_id = ${session.medico_id}`;

    // Core KPIs
    const [counts] = await sql`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE estado = 'revision' OR estado = 'completado') as pendientes,
        count(*) FILTER (WHERE estado = 'aprobado') as aprobados
      FROM estudios
      WHERE 1=1 ${roleFilter}
    `;

    // Classification Distribution
    const distribution = await sql`
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
    `;

    // Volume Chart (last 30 days) - using recibido_at instead of created_at
    const rawVolumeData = await sql`
      SELECT 
        date_trunc('day', recibido_at) as day,
        count(*) as total
      FROM estudios
      WHERE recibido_at > now() - interval '14 days'
      ${roleFilter}
      GROUP BY day
      ORDER BY day ASC
    `;

    // Fill missing days for a natural curve
    const chartData: any[] = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const match = rawVolumeData.find((r: any) => 
        new Date(r.day).toDateString() === d.toDateString()
      );
      chartData.push({
        date: dateStr,
        total: match ? parseInt(match.total) : 0,
        forecast: null
      });
    }

    // Add forecast points with a slightly curved trend
    const lastPoint = chartData[chartData.length - 1];
    if (lastPoint) {
      const baseVal = lastPoint.total;
      // Point 1: Next 24h
      chartData.push({
        date: "Próx. 24h",
        total: null,
        forecast: baseVal + 2
      });
      // Point 2: Next 48h (Non-linear growth)
      chartData.push({
        date: "Próx. 48h",
        total: null,
        forecast: baseVal + 5
      });

      // Special case: connect the last real point to the first forecast point
      lastPoint.forecast = lastPoint.total;
    }

    return {
      kpis: {
        total: counts.total || 0,
        pendientes: counts.pendientes || 0,
        aprobados: counts.aprobados || 0,
      },
      distribution: distribution || [],
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
