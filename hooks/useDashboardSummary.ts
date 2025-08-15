import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Types from the API endpoint
interface RiskPatient {
  id: string;
  name: string;
  score?: number;
  date: string; // ISO string for date
  questionnaire: string; // Código del cuestionario que generó la alerta
  riskType: 'suicide' | 'general' | 'tdah' | 'sustancias' | 'autolesion'; // Tipos de riesgo expandidos
  item9?: number; // Para PHQ-9, valor del ítem 9 (ideación suicida)
  // Campos para alertas OYS
  alertType?: 'score' | 'clinical'; // Tipo de alerta: por puntaje o clínica específica
  message?: string; // Mensaje específico de la alerta
  evidence?: Array<{ item: number; value: number; text: string }>; // Evidencia de alertas OYS
  recommendations?: string[]; // Recomendaciones clínicas
}

export interface DashboardSummary {
  activePatients: number;
  weekAppointments: number;
  questionnairesPending: number;
  riskPatients: RiskPatient[];
  weekVariation: number | null;
}

const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await axios.get<DashboardSummary>('/api/dashboard/summary');
  return data;
};

export const useDashboardSummary = () => {
  return useQuery<DashboardSummary, Error>({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary,
    // Opciones adicionales de React Query pueden ir aquí, como:
    // staleTime: 5 * 60 * 1000, // 5 minutos
    // refetchOnWindowFocus: true,
  });
};
