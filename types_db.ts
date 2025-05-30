export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          end_time: string
          google_calendar_event_id: string | null
          id: string
          metadata: Json | null
          paciente_id: string | null
          rrule: string | null
          start_time: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          google_calendar_event_id?: string | null
          id?: string
          metadata?: Json | null
          paciente_id?: string | null
          rrule?: string | null
          start_time: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          google_calendar_event_id?: string | null
          id?: string
          metadata?: Json | null
          paciente_id?: string | null
          rrule?: string | null
          start_time?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "anonymous_patient_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      cuestionarios: {
        Row: {
          activo: boolean | null
          actualizado_en: string
          codigo: string
          creado_en: string
          descripcion: string | null
          id: string
          items: Json
          titulo: string
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string
          codigo: string
          creado_en?: string
          descripcion?: string | null
          id?: string
          items: Json
          titulo: string
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string
          codigo?: string
          creado_en?: string
          descripcion?: string | null
          id?: string
          items?: Json
          titulo?: string
        }
        Relationships: []
      }
      envios_programados: {
        Row: {
          activo: boolean | null
          actualizado_en: string
          canal: string
          creado_en: string
          cuestionario_id: string
          fecha_inicio_programada: string | null
          frecuencia: string
          id: string
          paciente_id: string
          proximo_envio: string
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string
          canal: string
          creado_en?: string
          cuestionario_id: string
          fecha_inicio_programada?: string | null
          frecuencia: string
          id?: string
          paciente_id: string
          proximo_envio: string
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string
          canal?: string
          creado_en?: string
          cuestionario_id?: string
          fecha_inicio_programada?: string | null
          frecuencia?: string
          id?: string
          paciente_id?: string
          proximo_envio?: string
        }
        Relationships: [
          {
            foreignKeyName: "envios_programados_cuestionario_id_fkey"
            columns: ["cuestionario_id"]
            isOneToOne: false
            referencedRelation: "cuestionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_programados_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "anonymous_patient_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_programados_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      links_cuestionario: {
        Row: {
          consumido: boolean
          creado_en: string
          cuestionario_id: string
          enviado_desde: string | null
          envio_programado_id: string | null
          expira_en: string
          id: string
          paciente_id: string
          token: string
        }
        Insert: {
          consumido?: boolean
          creado_en?: string
          cuestionario_id: string
          enviado_desde?: string | null
          envio_programado_id?: string | null
          expira_en: string
          id?: string
          paciente_id: string
          token: string
        }
        Update: {
          consumido?: boolean
          creado_en?: string
          cuestionario_id?: string
          enviado_desde?: string | null
          envio_programado_id?: string | null
          expira_en?: string
          id?: string
          paciente_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_cuestionario_cuestionario_id_fkey"
            columns: ["cuestionario_id"]
            isOneToOne: false
            referencedRelation: "cuestionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_cuestionario_envio_programado_id_fkey"
            columns: ["envio_programado_id"]
            isOneToOne: false
            referencedRelation: "envios_programados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_cuestionario_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "anonymous_patient_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_cuestionario_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string
          psychologist_id: string
          unique_code: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          psychologist_id: string
          unique_code?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          psychologist_id?: string
          unique_code?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas: {
        Row: {
          creado_en: string
          cuestionario_id: string
          enviado_desde: string
          enviado_en: string
          envio_programado_id: string | null
          id: string
          paciente_id: string
          puntuacion: number
          respuestas: Json
        }
        Insert: {
          creado_en?: string
          cuestionario_id: string
          enviado_desde: string
          enviado_en?: string
          envio_programado_id?: string | null
          id?: string
          paciente_id: string
          puntuacion: number
          respuestas: Json
        }
        Update: {
          creado_en?: string
          cuestionario_id?: string
          enviado_desde?: string
          enviado_en?: string
          envio_programado_id?: string | null
          id?: string
          paciente_id?: string
          puntuacion?: number
          respuestas?: Json
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_cuestionario_id_fkey"
            columns: ["cuestionario_id"]
            isOneToOne: false
            referencedRelation: "cuestionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_envio_programado_id_fkey"
            columns: ["envio_programado_id"]
            isOneToOne: false
            referencedRelation: "envios_programados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "anonymous_patient_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_login: string | null
          last_name: string | null
          password_hash: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean
          last_login?: string | null
          last_name?: string | null
          password_hash?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          last_name?: string | null
          password_hash?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      users_backup: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          password_hash: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      anonymous_patient_view: {
        Row: {
          active: boolean | null
          id: string | null
          name: string | null
          unique_code: string | null
        }
        Insert: {
          active?: boolean | null
          id?: string | null
          name?: string | null
          unique_code?: string | null
        }
        Update: {
          active?: boolean | null
          id?: string | null
          name?: string | null
          unique_code?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_user: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
