"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getClinicConfig() {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  const [config] = await sql`
    SELECT 
      c.nombre as name, 
      c.guia_clinica as guide,
      c.guia_clinica_id as guide_id,
      COALESCE(c.porcentaje_iva, 0) as iva
    FROM clinicas c
    WHERE c.id = ${session.clinica_id}
  `;

  return config;
}

export async function updateClinicConfig(data: { name: string, guide: string, guide_id?: string, iva: number }) {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  await sql`
    UPDATE clinicas 
    SET nombre = ${data.name}, 
        guia_clinica = ${data.guide},
        porcentaje_iva = ${data.iva}
    WHERE id = ${session.clinica_id}
  `;

  return { success: true };
}
