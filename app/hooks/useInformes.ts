import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

// --- TIPOS DE DATOS ---

export interface InformeClinico {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  titulo: string;
  contenido: string;
  fecha_generacion: string;
  fecha_actualizacion: string;
  estado: 'borrador' | 'finalizado';
  metadatos: any;
  created_at: string;
  updated_at: string;
}

export interface InformeListItem {
  id: string;
  titulo: string;
  fecha_generacion: string;
  fecha_actualizacion: string;
  estado: 'borrador' | 'finalizado';
  metadatos: any;
}

export interface GenerateReportRequest {
  pacienteId: string;
}

export interface GenerateReportResponse {
  contenido: string;
  titulo: string;
  metadatos: any;
  paciente_id: string;
  psicologo_id: string;
}

export interface CreateReportRequest {
  titulo: string;
  contenido: string;
  estado?: 'borrador' | 'finalizado';
  metadatos?: any;
}

export interface UpdateReportRequest {
  titulo?: string;
  contenido?: string;
  estado?: 'borrador' | 'finalizado';
  metadatos?: any;
}

// --- FUNCIONES DE API ---

const getInformesByPatientId = async (patientId: string): Promise<InformeListItem[]> => {
  try {
    const { data } = await axios.get<InformeListItem[]>(
      `/api/informes/paciente/${patientId}`, 
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return []; // No es un error, simplemente no hay informes
    }
    throw error;
  }
};

const getInformeById = async (informeId: string): Promise<InformeClinico> => {
  const { data } = await axios.get<InformeClinico>(
    `/api/informes/${informeId}`, 
    { withCredentials: true }
  );
  return data;
};

const generateReport = async (request: GenerateReportRequest): Promise<GenerateReportResponse> => {
  const { data } = await axios.post<GenerateReportResponse>(
    '/api/informes/generar',
    request,
    { withCredentials: true }
  );
  return data;
};

const createReport = async (patientId: string, request: CreateReportRequest): Promise<InformeClinico> => {
  const { data } = await axios.post<InformeClinico>(
    `/api/informes/paciente/${patientId}`,
    request,
    { withCredentials: true }
  );
  return data;
};

const updateReport = async (informeId: string, request: UpdateReportRequest): Promise<InformeClinico> => {
  const { data } = await axios.put<InformeClinico>(
    `/api/informes/${informeId}`,
    request,
    { withCredentials: true }
  );
  return data;
};

const deleteReport = async (informeId: string): Promise<void> => {
  await axios.delete(`/api/informes/${informeId}`, { withCredentials: true });
};

// --- HOOKS ---

export const useInformes = (patientId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['informes', patientId];

  const informesQuery = useQuery<InformeListItem[], Error>({
    queryKey: queryKey,
    queryFn: () => getInformesByPatientId(patientId),
    enabled: !!patientId,
  });

  const generateReportMutation = useMutation<GenerateReportResponse, Error, GenerateReportRequest>({
    mutationFn: generateReport,
  });

  const createReportMutation = useMutation<InformeClinico, Error, CreateReportRequest>({
    mutationFn: (request) => createReport(patientId, request),
    onSuccess: () => {
      // Invalidar la lista de informes para refrescar
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateReportMutation = useMutation<InformeClinico, Error, { informeId: string; data: UpdateReportRequest }>({
    mutationFn: ({ informeId, data }) => updateReport(informeId, data),
    onSuccess: () => {
      // Invalidar tanto la lista como el informe específico
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteReportMutation = useMutation<void, Error, string>({
    mutationFn: deleteReport,
    onSuccess: () => {
      // Invalidar la lista de informes para refrescar
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    // Datos
    informes: informesQuery.data || [],
    isLoading: informesQuery.isLoading,
    error: informesQuery.error,
    
    // Mutaciones
    generateReport: generateReportMutation.mutateAsync,
    createReport: createReportMutation.mutateAsync,
    updateReport: updateReportMutation.mutateAsync,
    deleteReport: deleteReportMutation.mutateAsync,
    
    // Estados de mutaciones
    isGenerating: generateReportMutation.isPending,
    isCreating: createReportMutation.isPending,
    isUpdating: updateReportMutation.isPending,
    isDeleting: deleteReportMutation.isPending,
    
    // Errores de mutaciones
    generateError: generateReportMutation.error,
    createError: createReportMutation.error,
    updateError: updateReportMutation.error,
    deleteError: deleteReportMutation.error,
    
    // Funciones de utilidad
    refetch: informesQuery.refetch,
  };
};

export const useInforme = (informeId: string | null) => {
  const informeQuery = useQuery<InformeClinico, Error>({
    queryKey: ['informe', informeId],
    queryFn: () => getInformeById(informeId!),
    enabled: !!informeId,
  });

  return {
    informe: informeQuery.data,
    isLoading: informeQuery.isLoading,
    error: informeQuery.error,
    refetch: informeQuery.refetch,
  };
};
