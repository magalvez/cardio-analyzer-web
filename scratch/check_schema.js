import sql from "./lib/db.js";

async function checkSchema() {
  const columns = await sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_name IN ('usuarios', 'medicos', 'estudios')
  `;
  console.log(JSON.stringify(columns, null, 2));
  process.exit(0);
}

checkSchema();
