import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentFormData } from '@/components/appointments/AppointmentModal/AppointmentForm';

// Definir los tipos para las respuestas de la API
interface Appointment {
  id: string;
  title?: string;
  paciente_id: string;
  start_time: string;
  end_time: string;
  rrule?: string | null;
  metadata?: Record<string, unknown>;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// Payload común para crear y actualizar
interface ApiAppointmentPayload {
  title?: string;
  paciente_id: string;
  start_time: string;
  end_time: string;
  rrule?: string | null;
  metadata?: Record<string, unknown>;
}

// Convertir datos del formulario a formato API
const mapFormDataToApiPayload = (appointmentData: AppointmentFormData): ApiAppointmentPayload => {
  if (!appointmentData.patient) {
    throw new Error('Patient is required to create an appointment.');
  }

  const fullStartTime = `${appointmentData.date}T${appointmentData.startTime}:00`;
  const fullEndTime = `${appointmentData.date}T${appointmentData.endTime}:00`;

  return {
    title: appointmentData.title,
    paciente_id: appointmentData.patient.id,
    start_time: new Date(fullStartTime).toISOString(),
    end_time: new Date(fullEndTime).toISOString(),
  };
};

// Create appointment
const createAppointmentOnApi = async (appointmentData: AppointmentFormData): Promise<Appointment> => {
  const payload = mapFormDataToApiPayload(appointmentData);

  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.errors && Array.isArray(errorData.errors)) {
        // Format Zod errors for better readability
        errorMessage = errorData.errors.map((err: { path: string[], message: string }) => 
          `${err.path.join('.') || 'general'}: ${err.message}`
        ).join('; ');
        
        if (errorData.message) {
          errorMessage = `${errorData.message}: ${errorMessage}`;
        }
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      console.error('Failed to parse JSON error response:', e);
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Update appointment
interface UpdateAppointmentParams {
  id: string;
  data: AppointmentFormData;
}

const updateAppointmentOnApi = async ({ id, data }: UpdateAppointmentParams): Promise<Appointment> => {
  const payload = mapFormDataToApiPayload(data);

  const response = await fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      console.error('Failed to parse JSON error response:', e);
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Delete appointment
interface DeleteAppointmentParams {
  id: string;
  deleteAll?: boolean;
}

const deleteAppointmentOnApi = async ({ id, deleteAll = false }: DeleteAppointmentParams): Promise<{ success: boolean }> => {
  const url = new URL(`/api/appointments/${id}`, window.location.origin);
  if (deleteAll) {
    url.searchParams.append('deleteAll', 'true');
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      console.error('Failed to parse JSON error response:', e);
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const useAppointmentMutations = () => {
  const queryClient = useQueryClient();

  // Crear cita
  const createAppointmentMutation = useMutation<
    Appointment, 
    Error, 
    AppointmentFormData
  >({
    mutationFn: createAppointmentOnApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Actualizar cita
  const updateAppointmentMutation = useMutation<
    Appointment, 
    Error, 
    UpdateAppointmentParams
  >({
    mutationFn: updateAppointmentOnApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Eliminar cita 
  const deleteAppointmentMutation = useMutation<
    { success: boolean }, 
    Error, 
    DeleteAppointmentParams
  >({
    mutationFn: deleteAppointmentOnApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    // Create
    createAppointment: createAppointmentMutation.mutate,
    createAppointmentAsync: createAppointmentMutation.mutateAsync,
    isCreatingAppointment: createAppointmentMutation.isPending,
    createAppointmentError: createAppointmentMutation.error,

    // Update
    updateAppointment: updateAppointmentMutation.mutate,
    updateAppointmentAsync: updateAppointmentMutation.mutateAsync,
    isUpdatingAppointment: updateAppointmentMutation.isPending,
    updateAppointmentError: updateAppointmentMutation.error,

    // Delete
    deleteAppointment: deleteAppointmentMutation.mutate,
    deleteAppointmentAsync: deleteAppointmentMutation.mutateAsync,
    isDeletingAppointment: deleteAppointmentMutation.isPending,
    deleteAppointmentError: deleteAppointmentMutation.error,
  };
};
