import sql from "./lib/db.js";

async function debug() {
  const doctors = await sql`
    SELECT 
      u.email, 
      m.id as medico_id,
      m.nombre_completo,
      (SELECT count(*) FROM estudios WHERE medico_id = m.id) as count
    FROM usuarios u
    LEFT JOIN medicos m ON u.medico_id = m.id
  `;
  console.log(JSON.stringify(doctors, null, 2));
  process.exit(0);
}

debug();
