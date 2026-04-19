"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getTariffs() {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  const tariffs = await sql`
    SELECT 
      t.id, 
      t.precio, 
      t.moneda, 
      t.vigente_desde as active_from,
      m.nombre_completo as doctor
    FROM tarifas_medico t
    JOIN medicos m ON t.medico_id = m.id
    WHERE m.clinica_id = ${session.clinica_id}
    AND t.activo = true
    ORDER BY m.nombre_completo ASC
  `;

  return tariffs;
}

export async function updateTariff(medicoId: string, precio: number) {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  await sql.begin(async (sql) => {
    await sql`UPDATE tarifas_medico SET activo = false WHERE medico_id = ${medicoId}`;
    await sql`
      INSERT INTO tarifas_medico (medico_id, precio, moneda, vigente_desde, activo)
      VALUES (${medicoId}, ${precio}, 'COP', now(), true)
    `;
  });

  return { success: true };
}
