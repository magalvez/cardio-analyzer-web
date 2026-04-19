"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getLiquidations() {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  const liquidations = await sql`
    SELECT 
      l.*,
      m.nombre_completo as doctor,
      ld.estudio_id, 
      ld.tarifa_aplicada, 
      ld.fecha_estudio, 
      ld.paciente_nombre
    FROM liquidaciones l
    JOIN medicos m ON l.medico_id = m.id
    LEFT JOIN liquidacion_detalle ld ON ld.liquidacion_id = l.id
    WHERE l.clinica_id = ${session.clinica_id}
    ORDER BY l.created_at DESC
  `;

  return liquidations;
}

export async function createLiquidation(medicoId: string, start: string, end: string, porcentajeIva: number = 0) {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  const [stats] = await sql`
     SELECT count(*) as count 
     FROM estudios 
     WHERE medico_id = ${medicoId} 
     AND created_at BETWEEN ${start} AND ${end}
     AND estado = 'aprobado'
  `;

  const [tariff] = await sql`SELECT precio FROM tarifas_medico WHERE medico_id = ${medicoId} AND activo = true LIMIT 1`;
  const count = stats.count || 0;
  const price = tariff?.precio || 0;
  
  const totalBruto = count * price;
  const valorIva = totalBruto * (porcentajeIva / 100);
  const totalNeto = totalBruto + valorIva;

  const [newLiq] = await sql`
    INSERT INTO liquidaciones (
      clinica_id, medico_id, periodo_inicio, periodo_fin, 
      total_estudios, total_bruto, porcentaje_iva, valor_iva, total_neto, 
      estado, generado_por
    )
    VALUES (
      ${session.clinica_id}, ${medicoId}, ${start}, ${end}, 
      ${count}, ${totalBruto}, ${porcentajeIva}, ${valorIva}, ${totalNeto}, 
      'borrador', ${session.user_id}
    )
    RETURNING id
  `;

  return { success: true, id: newLiq.id };
}
