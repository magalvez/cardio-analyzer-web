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
        const owner = await sql`SELECT table_name, table_type, is_insertable_into FROM information_schema.tables WHERE table_name = 'estudios'`;
        console.log("Table info:", JSON.stringify(owner, null, 2));

        const grants = await sql`SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'estudios'`;
        console.log("Grants:", JSON.stringify(grants, null, 2));

    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
