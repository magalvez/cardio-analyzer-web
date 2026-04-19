import postgres from 'postgres';

const globalForDb = global as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

const dbUrl = process.env.DATABASE_URL!;
let connectionConfig: any = dbUrl;

try {
  console.log("Connecting as:", process.env.DATABASE_USER, "to", process.env.DATABASE_HOST);
  console.log("Password length:", process.env.DATABASE_PASSWORD?.length, "Contains #:", process.env.DATABASE_PASSWORD?.includes('#'));
  connectionConfig = {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!) || 5432,
    database: process.env.DATABASE_DB,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: 'require',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  };
} catch (e) {
  console.error("Invalid DATABASE_URL, falling back to raw string");
}

const sql = globalForDb.sql ?? postgres(connectionConfig);

if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

export default sql;
