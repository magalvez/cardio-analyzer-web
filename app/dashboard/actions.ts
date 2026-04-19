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
        SELECT unnest(ARRAY['normal', 'elevada', 'anormal']) as clasificacion
      )
      SELECT 
        c.clasificacion, 
        COALESCE(count(r.id), 0) as count,
        COALESCE(round(count(r.id) * 100.0 / NULLIF(sum(count(r.id)) OVER (), 0), 1), 0) as percentage
      FROM categories c
      LEFT JOIN resultados_ia r ON c.clasificacion = r.clasificacion
      LEFT JOIN estudios e ON e.id = r.estudio_id
      WHERE 1=1 ${roleFilter.replace('AND', 'AND e.')}
      GROUP BY c.clasificacion
    `;

    // Volume Chart (last 30 days) - using recibido_at instead of created_at
    const volumeData = await sql`
      SELECT 
        to_char(recibido_at, 'DD Mon') as date,
        count(*) as total
      FROM estudios
      WHERE recibido_at > now() - interval '30 days'
      ${roleFilter}
      GROUP BY date, to_char(recibido_at, 'YYYYMMDD')
      ORDER BY to_char(recibido_at, 'YYYYMMDD') ASC
    `;

    // Add a forecast point for visualization
    const lastPoint = volumeData[volumeData.length - 1];
    if (lastPoint) {
      const forecastValue = Math.round(parseInt(lastPoint.total) * 1.2);
      volumeData.push({
        date: "Forecast",
        total: forecastValue.toString(),
        isForecast: true
      });
    }

    return {
      kpis: {
        total: counts.total || 0,
        pendientes: counts.pendientes || 0,
        aprobados: counts.aprobados || 0,
      },
      distribution: distribution || [],
      volumeData: volumeData || []
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
