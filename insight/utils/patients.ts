import { createSupabaseClient } from './supabase';
import { NewPatient, Patient, PatientUpdate } from '@/types/patients';

export class PatientService {
  static async createPatient(data: NewPatient): Promise<Patient | null> {
    const supabase = createSupabaseClient();
    
    const { data: patient, error } = await supabase
      .from('patients')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating patient:', error);
      throw error;
    }

    return patient;
  }

  static async updatePatient(id: string, data: PatientUpdate): Promise<Patient | null> {
    const supabase = createSupabaseClient();
    
    const { data: patient, error } = await supabase
      .from('patients')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient:', error);
      throw error;
    }

    return patient;
  }

  static async getPatientByCode(uniqueCode: string): Promise<Patient | null> {
    const supabase = createSupabaseClient();
    
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('unique_code', uniqueCode)
      .eq('active', true)
      .single();

    if (error) {
      console.error('Error fetching patient:', error);
      return null;
    }

    return patient;
  }

  static async getPsychologistPatients(psychologistId: string): Promise<Patient[]> {
    const supabase = createSupabaseClient();
    
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('psychologist_id', psychologistId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }

    return patients || [];
  }
}
