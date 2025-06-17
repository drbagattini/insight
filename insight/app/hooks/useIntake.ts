import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

// --- TIPOS DE DATOS ---

export interface IntakeFields {
  // Step 1
  fechaEntrevista?: string;
  nombrePaciente?: string;
  edad?: number;
  sexo?: 'Masculino' | 'Femenino' | 'Otro';
  estadoCivil?: 'Soltero/a' | 'Casado/a' | 'Concubinato estable';
  ocupacion?: 'Estudiante' | 'Trabajo dependiente' | 'Trabajo independiente' | 'Desempleado' | 'Otra';
  grupoFamiliar?: string;

  // Step 2
  motivoConsulta?: string;
  derivante?: 'Psiquiatra' | 'Pediatra' | 'Familia' | 'Asistente social' | 'Consulta espontánea';
  presentacion?: string;
  diagnosticoTexto?: string;
  nivelPersonalidad?: 'Saludable' | 'Neurótico' | 'Borderline' | 'Psicótico';
  etiologia?: string;

  // Step 3
  malestarPaciente?: string;
  atribucionPaciente?: 'Psicológicas' | 'Sociales' | 'Familia' | 'Trabajo' | 'Biológicas' | 'Otros';
  ayudaEsperada?: string[];
  ayudaBuscadaOtro?: string;
  gravedadTerapeuta?: 'Ausencia' | 'Leve' | 'Moderada' | 'Grave' | 'Extrema';
  gaf?: number;
  apoyoSocial?: string;

  // Step 4
  medicacionPrev?: string;
  antecedentesSM?: string;
  biologicos?: string;

  // Step 5
  estrategia?: string;
  posicionTerap?: string;
  derivacion?: 'Sin derivaciones' | 'Psiquiatra' | 'Asistente social' | 'Psicopedagogo' | 'Pediatra' | 'Neuropediatra';
}

export interface IntakeData {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  estado: 'sin_registro' | 'empezada' | 'finalizada';
  datos: IntakeFields;
  fecha_inicio: string;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
}

// --- LÓGICA DEL HOOK ---

// Helper function to determine if intake data has meaningful content
const hasMeaningfulContent = (intakeData: IntakeData | null): boolean => {
  if (!intakeData || !intakeData.datos) {
    return false;
  }
  const { datos } = intakeData;
  // Check for some key fields that indicate actual content beyond a blank slate
  return !!(
    datos.motivoConsulta ||
    datos.presentacion ||
    datos.diagnosticoTexto ||
    datos.malestarPaciente ||
    (datos.ayudaEsperada && datos.ayudaEsperada.length > 0) ||
    datos.estrategia
  );
};

const getIntakeByPatientId = async (patientId: string): Promise<IntakeData | null> => {
  try {
    const { data } = await axios.get<IntakeData>(`/api/patients/${patientId}/intake`, { withCredentials: true });
    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null; // No es un error, simplemente no existe la entrevista
    }
    throw error; // Lanza otros errores
  }
};

const createIntake = async (patientId: string): Promise<IntakeData> => {
  const { data } = await axios.post<IntakeData>(`/api/patients/${patientId}/intake`, {}, { withCredentials: true });
  return data;
};

const updateIntake = async ({ patientId, intakeId, updateData }: { patientId: string; intakeId: string; updateData: Partial<IntakeData> }) => {
  const { data } = await axios.patch<IntakeData>(`/api/patients/${patientId}/intake`, updateData, { withCredentials: true });
  return data;
};

export const useIntake = (patientId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['intake', patientId];

  const intakeQuery = useQuery<IntakeData | null, Error>({
    queryKey: queryKey,
    queryFn: () => getIntakeByPatientId(patientId),
    enabled: !!patientId, // Solo ejecuta la query si hay un patientId
  });

  const createIntakeMutation = useMutation<IntakeData, Error, void>({
    mutationFn: () => createIntake(patientId),
    onSuccess: (newData) => {
      // Actualiza el cache de la query con los datos de la nueva entrevista
      queryClient.setQueryData(queryKey, newData);
      // Opcionalmente, puedes invalidar para forzar un refetch
      // queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateIntakeMutation = useMutation<IntakeData, Error, { intakeId: string; updateData: Partial<IntakeData> }>({
    mutationFn: (variables) => updateIntake({ ...variables, patientId }),
    onSuccess: (updatedData) => {
      // Actualiza el cache de la query con los datos actualizados
      queryClient.setQueryData(queryKey, updatedData);
    },
    // Opcionalmente, puedes manejar onMutate para optimistic updates
  });

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
