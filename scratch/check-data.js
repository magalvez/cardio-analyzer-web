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
        const users = await sql`SELECT id, email, clinica_id, medico_id, rol FROM usuarios`;
        console.log("Users:", JSON.stringify(users, null, 2));
        
        const clinics = await sql`SELECT id, nombre FROM clinicas`;
        console.log("Clinics:", JSON.stringify(clinics, null, 2));

        const studiesCount = await sql`SELECT count(*) FROM estudios`;
        console.log("Total studies in DB:", studiesCount[0].count);

        const sampleStudies = await sql`SELECT clinica_id, medico_solicitante_id, estado FROM estudios LIMIT 5`;
        console.log("Sample studies:", JSON.stringify(sampleStudies, null, 2));

    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
