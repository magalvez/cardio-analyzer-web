const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_DB,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: 'require'
});

async function check() {
    try {
        const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'estudios'`;
        console.log("Columns of estudios:", columns.map(c => c.column_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

check();
