// Tipos generados automáticamente por Supabase
// Asegúrate de actualizarlos si cambias la estructura de la base de datos

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pacientes: {
        Row: {
          id: string
          nombre: string
          email: string | null
          telefono: string | null
          fecha_nacimiento: string | null
          genero: string | null
          psicologo_id: string
          created_at: string
          updated_at: string
          activo: boolean
        }
        Insert: {
          id?: string
          nombre: string
          email?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          psicologo_id: string
          created_at?: string
          updated_at?: string
          activo?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          email?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          psicologo_id?: string
          created_at?: string
          updated_at?: string
          activo?: boolean
        }
      }
      cuestionarios: {
        Row: {
          id: string
          codigo: string
          titulo: string
          descripcion: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          titulo: string
          descripcion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          titulo?: string
          descripcion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      respuestas: {
        Row: {
          id: string
          paciente_id: string
          cuestionario_id: string
          respuestas: Json
          puntuacion_total: number
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Insert: {
          id?: string
          paciente_id: string
          cuestionario_id: string
          respuestas: Json
          puntuacion_total: number
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Update: {
          id?: string
          paciente_id?: string
          cuestionario_id?: string
          respuestas?: Json
          puntuacion_total?: number
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          nombre: string | null
          apellido: string | null
          telefono: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          psicologo_id: string | null
        }
        Insert: {
          id: string
          email: string
          nombre?: string | null
          apellido?: string | null
          telefono?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          psicologo_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          nombre?: string | null
          apellido?: string | null
          telefono?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          psicologo_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
