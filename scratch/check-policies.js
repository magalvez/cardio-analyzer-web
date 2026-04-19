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
        const policies = await sql`SELECT * FROM pg_policies WHERE tablename = 'estudios'`;
        console.log("Policies:", JSON.stringify(policies, null, 2));
    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
