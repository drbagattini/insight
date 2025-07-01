import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import dayjs from 'dayjs';
import { intakeDataSchema } from '@/lib/validation/intakeDataSchema';

// --- CANONICAL DATA TYPES ---

// Type for the 'data' field, inferred directly from the Zod schema.
// This is the single source of truth for the intake form fields.
export type IntakeData = z.infer<typeof intakeDataSchema>;

// Type for the full database record from 'evoluciones_clinicas'.
export interface IntakeRecord {
  id: string;
  patient_id: string;
  created_by: string;
  status: 'draft' | 'final';
  data: IntakeData;
  tipo: 'intake';
  version: number;
  schema_version: number;
  urgente: boolean;
  created_at: string;
  updated_at: string;
}

// --- HOOK LOGIC ---

// Helper to check if an intake record has meaningful, user-entered content.
const hasMeaningfulContent = (record: IntakeRecord | null): boolean => {
  if (!record?.data) return false;
  const { data } = record;
  return !!(data.motivoConsulta || data.presentacion || data.diagnosticoTexto || data.malestarPaciente || data.estrategia);
};

// --- API FUNCTIONS ---

const getIntakeByPatientId = async (patientId: string): Promise<IntakeRecord | null> => {
  try {
    const { data } = await axios.get<IntakeRecord>(`/api/patients/${patientId}/intake`, { withCredentials: true });
    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null; // No intake record found for this patient.
    }
    throw error; // Re-throw other errors.
  }
};

const createIntake = async (patientId: string): Promise<IntakeRecord> => {
  const { data } = await axios.post<IntakeRecord>(`/api/patients/${patientId}/intake`, {}, { withCredentials: true });
  return data;
};

const updateIntake = async ({ patientId, updateData, publish = false }: { patientId: string; updateData: Partial<IntakeData>; publish?: boolean }) => {
  // Safeguard: Ensure fechaEntrevista is a valid Date object before sending.
  if (updateData.fechaEntrevista) {
    if (!dayjs(updateData.fechaEntrevista).isValid()) {
      console.warn('🛡️ [useIntake Safeguard] Invalid interview date detected. It will not be sent to protect existing data.', updateData.fechaEntrevista);
      delete updateData.fechaEntrevista;
    }
  }

  const payload = { data: updateData, publish };
  console.log('🚀 [useIntake] Enviando payload a la API:', JSON.stringify(payload, null, 2));

  try {
    const { data } = await axios.patch<IntakeRecord>(`/api/patients/${patientId}/intake`, payload, { withCredentials: true });
    console.log('✅ [useIntake] Respuesta de la API PATCH:', data?.data);
    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      console.log('No draft found, creating one before updating...');
      await createIntake(patientId);
      const { data } = await axios.patch<IntakeRecord>(`/api/patients/${patientId}/intake`, payload, { withCredentials: true });
      console.log('✅ [useIntake] Respuesta de la API PATCH (draft creado):', data?.data);
      return data;
    }
    throw error;
  }
};

// --- REACT QUERY HOOK ---

export const useIntake = (patientId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['intake', patientId];

  const intakeQuery = useQuery<IntakeRecord | null, Error>({
    queryKey,
    queryFn: () => getIntakeByPatientId(patientId),
    enabled: !!patientId,
  });

  const createIntakeMutation = useMutation<IntakeRecord, Error, void>({
    mutationFn: () => createIntake(patientId),
    onSuccess: (newRecord) => {
      queryClient.setQueryData(queryKey, newRecord);
    },
  });

  const updateIntakeMutation = useMutation<IntakeRecord, Error, { updateData: Partial<IntakeData>; publish?: boolean }>(
    {
      mutationFn: (variables) => updateIntake({ ...variables, patientId }),
      onSuccess: (updatedRecord) => {
        queryClient.setQueryData(queryKey, updatedRecord);
      },
    }
  );

  const intakeData = intakeQuery.data;
  const intakeRowExists = !!intakeData;
  const intakeHasContent = hasMeaningfulContent(intakeData ?? null);

  return {
    intakeData,
    isLoading: intakeQuery.isLoading,
    error: intakeQuery.error,
    intakeRowExists,
    intakeHasContent,
    createIntake: createIntakeMutation.mutateAsync,
    updateIntake: updateIntakeMutation.mutateAsync,
    isCreating: createIntakeMutation.isPending,
    isUpdating: updateIntakeMutation.isPending,
  };
};
