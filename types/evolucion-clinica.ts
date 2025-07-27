// Tipos para el módulo de Evolución Clínica

// Solo tipos que se pueden crear manualmente por el psicólogo
// 'supervision' y 'paciente' se crearán automáticamente desde otros módulos
export type EntryType = 'clinica' | 'supervision' | 'sesion' | 'paciente';
export type ManualEntryType = 'clinica' | 'sesion'; // Solo para el selector del editor

export interface EvolucionClinicaEntry {
  id: string;
  paciente_id: string;
  author_id: string;
  entry_type: EntryType;
  content: string;
  metadata: Record<string, any>;
  tags: string[];
  is_draft?: boolean; // Opcional hasta ejecutar SQL
  created_at: string;
  updated_at: string;
}

export interface EvolucionClinicaInsert {
  paciente_id: string;
  author_id: string;
  entry_type: EntryType;
  content: string;
  metadata?: Record<string, any>;
  tags?: string[];
  is_draft?: boolean;
}

export interface EvolucionClinicaUpdate {
  content?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  is_draft?: boolean;
}

// Tipos para la UI
export interface EvolucionClinicaWithAuthor extends EvolucionClinicaEntry {
  author_name?: string;
  author_email?: string;
}

// Labels actualizados según especificaciones
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  clinica: 'Evolución Clínica',
  supervision: 'Supervisión IA',
  sesion: 'Registro de Sesión',
  paciente: 'Entrada del Paciente'
};

// Solo los tipos que se pueden crear manualmente
export const MANUAL_ENTRY_TYPE_LABELS: Record<ManualEntryType, string> = {
  clinica: 'Evolución Clínica',
  sesion: 'Registro de Sesión'
};

export const ENTRY_TYPE_ICONS: Record<EntryType, string> = {
  clinica: '📋',
  supervision: '🤖',
  sesion: '📝',
  paciente: '💬'
};

export const ENTRY_TYPE_COLORS: Record<EntryType, string> = {
  clinica: 'bg-blue-100 text-blue-800 border-blue-200',
  supervision: 'bg-purple-100 text-purple-800 border-purple-200',
  sesion: 'bg-green-100 text-green-800 border-green-200',
  paciente: 'bg-orange-100 text-orange-800 border-orange-200'
};
