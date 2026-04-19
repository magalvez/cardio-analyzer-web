const postgres = require('postgres');
const sql = postgres({
    host: "aws-1-us-west-2.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    username: "mapa_webapp.qmaqdoowkrgncsozeqks",
    password: "MapaWebApp2026#Prod!",
    ssl: 'require'
});

async function run() {
    try {
        await sql`ALTER TABLE estudios DISABLE ROW LEVEL SECURITY`;
        await sql`ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY`;
        await sql`ALTER TABLE resultados_ia DISABLE ROW LEVEL SECURITY`;
        await sql`ALTER TABLE medicos DISABLE ROW LEVEL SECURITY`;
        console.log("RLS disabled on core tables.");
    } catch (e) {
        console.error("Permission Error:", e.message);
    } finally {
        await sql.end();
    }
}

run();
