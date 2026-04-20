const postgres = require('postgres');
const bcrypt = require('bcryptjs');

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
        const email = "admin@mapacardio.com";
        const password = "MapaAdmin2026#!";
        
        const [user] = await sql`SELECT password_hash FROM usuarios WHERE email = ${email}`;
        
        if (!user) {
            console.log("User not found");
            return;
        }
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log("Password is valid:", isValid);
        console.log("Hash in DB:", user.password_hash);

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await sql.end();
    }
}

check();
