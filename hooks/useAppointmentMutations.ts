import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentFormData } from '@/components/appointments/AppointmentModal/AppointmentForm'; // Adjust path as necessary

// Define the expected shape of the data returned by the API after creating an appointment
// This should match your backend's response. For now, a simple placeholder.
interface CreatedAppointment {
  id: string;
  title?: string;
  patient_id: string;
  date: string;
  start_time: string;
  end_time: string;
  // Add other fields returned by the API, like rrule, user_id, etc.
}

// Define the payload for the API
interface ApiAppointmentPayload {
  title?: string;
  paciente_id: string; // Cambiado a paciente_id para coincidir con el esquema de la API
  // date: string; // Date is now part of start_time and end_time
  start_time: string; // Expected to be ISO string
  end_time: string;   // Expected to be ISO string
  // rrule?: string; // Will be added in later stages
}

const createAppointmentOnApi = async (appointmentData: AppointmentFormData): Promise<CreatedAppointment> => {
  if (!appointmentData.patient) {
    throw new Error('Patient is required to create an appointment.');
  }

  const fullStartTime = `${appointmentData.date}T${appointmentData.startTime}:00`;
  const fullEndTime = `${appointmentData.date}T${appointmentData.endTime}:00`;

  // Consider timezone handling if necessary, for now, assuming local times
  // If your server/Supabase expects UTC, you'll need to convert these.
  // For simplicity, we're sending them as is, which Supabase typically stores as TIMESTAMPTZ considering the session's timezone or a default.

  const payload: ApiAppointmentPayload = {
    title: appointmentData.title,
    paciente_id: appointmentData.patient.id, // Cambiado a paciente_id para coincidir con el esquema de la API
    start_time: new Date(fullStartTime).toISOString(),
    end_time: new Date(fullEndTime).toISOString(),
  };

  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.errors && Array.isArray(errorData.errors)) {
        // Format Zod errors for better readability
        errorMessage = errorData.errors.map((err: { path: string[], message: string }) => `${err.path.join('.') || 'general'}: ${err.message}`).join('; ');
        if (errorData.message) { // Prepend the general message if available
            errorMessage = `${errorData.message}: ${errorMessage}`;
        }
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // response.json() failed or errorData was not in the expected format
      // errorMessage remains the default HTTP status error
      console.error('Failed to parse JSON error response:', e);
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const useAppointmentMutations = () => {
  const queryClient = useQueryClient();

  const createAppointmentMutation = useMutation<CreatedAppointment, Error, AppointmentFormData>(
    {
      mutationFn: createAppointmentOnApi,
      // onSuccess will be handled in ETAPA 2 for optimistic updates
      // onError can be handled here or in the component using the mutation
      // For example:
      // onError: (error) => {
      //   console.error('Error creating appointment:', error.message);
      //   // TODO: Show error toast to user
      // },
    }
  );

  // TODO: Add updateAppointmentMutation and deleteAppointmentMutation in later stages

  return {
    createAppointment: createAppointmentMutation.mutate,
    createAppointmentAsync: createAppointmentMutation.mutateAsync, // if async version is needed
    isCreatingAppointment: createAppointmentMutation.isPending,
    createAppointmentError: createAppointmentMutation.error,
  };
};
