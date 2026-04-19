const postgres = require('postgres');
const sql = postgres({
    host: "aws-1-us-west-2.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    username: "mapa_webapp.qmaqdoowkrgncsozeqks",
    password: "MapaWebApp2026#Prod!",
    ssl: 'require'
});

async function check() {
    try {
        const schemas = await sql`SELECT schema_name FROM information_schema.schemata`;
        console.log("Schemas:", schemas.map(s => s.schema_name).join(', '));
    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
