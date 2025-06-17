export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'psicologo' | 'paciente';
          first_name: string;
          last_name: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'psicologo' | 'paciente';
          first_name?: string;
          last_name?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          password_hash?: string;
          role?: 'admin' | 'psicologo' | 'paciente';
          first_name?: string;
          last_name?: string;
          is_active?: boolean;
        };
      };
      patients: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          psychologist_id: string;
          name: string;
          email: string | null;
          whatsapp: string | null;
          active: boolean;
          unique_code: string;
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          psychologist_id: string;
          name: string;
          email?: string | null;
          whatsapp?: string | null;
          active?: boolean;
          unique_code?: string;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          psychologist_id?: string;
          name?: string;
          email?: string | null;
          whatsapp?: string | null;
          active?: boolean;
          unique_code?: string;
          metadata?: Record<string, any>;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
