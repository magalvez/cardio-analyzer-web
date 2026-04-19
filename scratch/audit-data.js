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
        const studiesCount = await sql`SELECT count(*) FROM estudios`;
        console.log("Total studies in DB:", studiesCount[0].count);
        
        const medicoCount = await sql`SELECT count(*) FROM medicos`;
        console.log("Total medicos in DB:", medicoCount[0].count);

        const pacienteCount = await sql`SELECT count(*) FROM pacientes`;
        console.log("Total pacientes in DB:", pacienteCount[0].count);

    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
