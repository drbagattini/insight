import { Database } from './database';

export type Patient = Database['public']['Tables']['patients']['Row'];
export type NewPatient = Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'unique_code'>;
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
