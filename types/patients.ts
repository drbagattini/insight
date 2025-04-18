import { Database } from './database';

export type Patient = Database['public']['Tables']['patients']['Row'];
export type NewPatient = {
  name: string;
  email?: string | null;
  whatsapp?: string | null;
  metadata?: Record<string, any>;
};
export type PatientUpdate = Partial<NewPatient>;

export interface PatientWithQuestionnaires extends Patient {
  questionnaires?: {
    id: string;
    type: string;
    completed: boolean;
    sent_at: string;
    completed_at?: string;
  }[];
}
