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
        const data = await sql`SELECT * FROM vista_estudios_dashboard LIMIT 1`;
        console.log("Sample View Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("View Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
