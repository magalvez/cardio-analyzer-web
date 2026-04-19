const { URL } = require('url');
const dbUrl = "postgresql://mapa_webapp.qmaqdoowkrgncsozeqks:MapaWebApp2026#Prod!@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
try {
    const parsed = new URL(dbUrl);
    console.log("Protocol:", parsed.protocol);
    console.log("Username:", parsed.username);
    console.log("Password:", parsed.password);
    console.log("Host:", parsed.host);
    console.log("Pathname:", parsed.pathname);
} catch (e) {
    console.error("Failed to parse URL", e);
}
