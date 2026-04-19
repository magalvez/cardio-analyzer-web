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
        const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'estudios'`;
        console.log("Columns of estudios:", columns.map(c => c.column_name).join(', '));
        
        const usuariosColumns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'`;
        console.log("Columns of usuarios:", usuariosColumns.map(c => c.column_name).join(', '));
    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
