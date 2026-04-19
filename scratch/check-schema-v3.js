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
        const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'pacientes'`;
        console.log("Columns of pacientes:", columns.map(c => c.column_name).join(', '));
        
        const riaColumns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'resultados_ia'`;
        console.log("Columns of resultados_ia:", riaColumns.map(c => c.column_name).join(', '));
    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
