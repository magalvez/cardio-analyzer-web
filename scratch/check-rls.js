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
        const id = "111d74bf-9b4b-4b0a-b97f-ed1579adc1d7";
        const study = await sql`SELECT * FROM estudios WHERE id = ${id}`;
        console.log("Study from table:", JSON.stringify(study, null, 2));
    } catch (e) {
        console.error("Query Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
