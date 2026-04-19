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
        const count = await sql`SELECT count(*) FROM vista_estudios_dashboard`;
        console.log("Count in vista_estudios_dashboard:", count[0].count);
    } catch (e) {
        console.error("View Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
