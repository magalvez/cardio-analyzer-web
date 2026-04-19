export type UserRole = 'medico' | 'admin';
export type StudyStatus = 'procesando' | 'completado' | 'revision' | 'aprobado' | 'cancelado';
export type DipperPattern = 'dipper' | 'non-dipper' | 'extreme-dipper' | 'riser';
export type Classification = 'normal' | 'elevada' | 'anormal';
export type LiquidationStatus = 'borrador' | 'enviado' | 'pagado';

export interface Clinic {
  id: string;
  nombre: string;
  guia_clinica: string;
  guia_clinica_id: string;
  activa: boolean;
  created_at: Date;
}

export interface Doctor {
  id: string;
  clinica_id: string;
  telegram_user_id: string;
  telegram_username: string;
  nombre_completo: string;
  especialidad: string;
  registro_medico: string;
  created_at: Date;
}

export interface Patient {
  id: string;
  clinica_id: string;
  nombre_completo: string;
  cedula: string;
  fecha_nacimiento: Date;
  edad: number;
  sexo: string;
  created_at: Date;
}

export interface User {
  id: string;
  clinica_id: string;
  medico_id: string | null;
  email: string;
  password_hash: string;
  rol: UserRole;
  activo: boolean;
  created_at: Date;
}

export interface Study {
  id: string;
  clinica_id: string;
  medico_id: string;
  paciente_id: string;
  sesion_id: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  software_dispositivo: string;
  lecturas_totales: number;
  lecturas_validas: number;
  porcentaje_validas: number;
  motivo_consulta: string;
  estado: StudyStatus;
  notas_medico: string;
  aprobado_at: Date | null;
  aprobado_por: string | null;
  created_at: Date;
}

export interface IAResults {
  id: string;
  estudio_id: string;
  promedio_pas_general: number;
  promedio_pad_general: number;
  promedio_pam_general: number;
  promedio_fc_general: number;
  promedio_pas_dia: number;
  promedio_pad_dia: number;
  promedio_pas_noche: number;
  promedio_pad_noche: number;
  carga_pas_dia_pct: number;
  carga_pad_dia_pct: number;
  carga_pas_noche_pct: number;
  carga_pad_noche_pct: number;
  caida_nocturna_pas_pct: number;
  caida_nocturna_pad_pct: number;
  patron_dipper: DipperPattern;
  morning_surge_detectado: boolean;
  morning_surge_pas: number;
  aasi: number;
  msi: number;
  hipotension_diurna_detectada: boolean;
  hipotension_nocturna_detectada: boolean;
  clasificacion: Classification;
  guia_usada: string;
  resumen_motor: string;
  resumen_gemini: string;
  confianza_global: number;
  modelo_usado: string;
  raw_extraccion: any;
  created_at: Date;
}
