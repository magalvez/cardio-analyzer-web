"use server";

import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getDoctors() {
  const session = await getSession();
  if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

  const doctors = await sql`
    SELECT 
      u.id, 
      u.email, 
      u.rol, 
      u.activo,
      m.id as medico_id,
      m.nombre_completo as name,
      m.especialidad as specialty,
      m.telegram_user_id::text as telegram_user_id,
      m.telegram_username,
      (SELECT count(*)::int FROM estudios e WHERE e.medico_solicitante_id = m.id) as studies_count
    FROM usuarios u
    LEFT JOIN medicos m ON u.medico_id = m.id
    WHERE u.clinica_id = ${session.clinica_id}
    ORDER BY u.rol DESC, m.nombre_completo ASC
  `;

  return doctors;
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const session = await getSession();
    if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

    try {
        await sql.begin(async (sql) => {
            // Toggle user account access status
            const [user] = await sql`
                UPDATE usuarios 
                SET activo = ${!currentStatus}, updated_at = now() 
                WHERE id = ${userId}
                RETURNING medico_id
            `;
            
            // If it's a doctor, toggle their professional profile status too
            if (user && user.medico_id) {
                await sql`
                    UPDATE medicos 
                    SET activo = ${!currentStatus}, updated_at = now() 
                    WHERE id = ${user.medico_id}
                `;
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error toggling user status:", error);
        return { success: false, error: (error as Error).message };
    }
}
export async function createUser(data: { 
    name: string, 
    email: string, 
    role: string, 
    specialty?: string, 
    telegram_user_id?: string, 
    telegram_username?: string 
}) {
    const session = await getSession();
    if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Cardio2026*', 10);

    try {
        await sql.begin(async (sql) => {
            let medico_id = null;

            if (data.role === 'medico') {
                const [medico] = await sql`
                    INSERT INTO medicos (clinica_id, nombre_completo, especialidad, telegram_user_id, telegram_username)
                    VALUES (${session.clinica_id}, ${data.name}, ${data.specialty || 'General'}, ${data.telegram_user_id ? BigInt(data.telegram_user_id) : null}, ${data.telegram_username || null})
                    RETURNING id
                `;
                medico_id = medico.id;
            }

            await sql`
                INSERT INTO usuarios (clinica_id, medico_id, email, rol, password_hash)
                VALUES (${session.clinica_id}, ${medico_id}, ${data.email}, ${data.role}, ${hashedPassword})
            `;
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

export async function updateUser(id: string, data: { 
    name: string, 
    email: string, 
    role: string, 
    specialty?: string, 
    telegram_user_id?: string, 
    telegram_username?: string 
}) {
    const session = await getSession();
    if (!session || session.rol !== 'admin') throw new Error("Unauthorized");

    try {
        await sql.begin(async (sql) => {
            const [user] = await sql`SELECT medico_id FROM usuarios WHERE id = ${id}`;

            if (data.role === 'medico') {
                if (user.medico_id) {
                    await sql`
                        UPDATE medicos SET 
                            nombre_completo = ${data.name},
                            especialidad = ${data.specialty || 'General'},
                            telegram_user_id = ${data.telegram_user_id ? BigInt(data.telegram_user_id) : null},
                            telegram_username = ${data.telegram_username || null},
                            updated_at = now()
                        WHERE id = ${user.medico_id}
                    `;
                } else {
                    const [medico] = await sql`
                        INSERT INTO medicos (clinica_id, nombre_completo, especialidad, telegram_user_id, telegram_username)
                        VALUES (${session.clinica_id}, ${data.name}, ${data.specialty || 'General'}, ${data.telegram_user_id ? BigInt(data.telegram_user_id) : null}, ${data.telegram_username || null})
                        RETURNING id
                    `;
                    await sql`UPDATE usuarios SET medico_id = ${medico.id} WHERE id = ${id}`;
                }
            }

            await sql`
                UPDATE usuarios SET 
                    email = ${data.email},
                    rol = ${data.role},
                    updated_at = now()
                WHERE id = ${id}
            `;
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}
