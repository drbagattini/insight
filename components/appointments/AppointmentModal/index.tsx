"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import AppointmentForm, { AppointmentFormData } from './AppointmentForm'; // Import AppointmentFormData
import { Patient } from './PatientSelector'; // Assuming Patient type is exported from PatientSelector
import { useAppointmentMutations } from '../../../hooks/useAppointmentMutations'; // Import the mutation hook

// Define the shape of the appointment prop more specifically for the modal's needs
// This might align with what FullCalendar or your backend expects, or what AppointmentForm needs for initialization.
export interface ModalAppointmentData {
  id?: string; // Optional for new appointments
  title?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  patient?: Patient | null;
  // Add other fields like rrule, notes etc. as they are implemented
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: ModalAppointmentData | null; // Use the more specific type
  // onSave: (data: AppointmentFormData) => void; // This will be handled by react-query mutation hook later
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const isEditing = !!appointment?.id;
  const { 
    createAppointment, isCreatingAppointment, createAppointmentError,
    updateAppointment, isUpdatingAppointment, updateAppointmentError
  } = useAppointmentMutations();
  
  // Estado compuesto para mostrar errores de creación o actualización
  const isSubmitting = isCreatingAppointment || isUpdatingAppointment;
  const submissionError = createAppointmentError || updateAppointmentError;

  const handleFormSubmit = (data: AppointmentFormData) => {
    if (isEditing && appointment?.id) {
      // Actualizar cita existente
      updateAppointment(
        { 
          id: appointment.id,
          data
        },
        {
          onSuccess: () => {
            console.log('Appointment updated successfully');
            onClose();
          },
          onError: (error) => {
            console.error('Failed to update appointment:', error.message);
            // Error handling is via updateAppointmentError
          }
        }
      );
    } else {
      // Crear nueva cita
      createAppointment(data, {
        onSuccess: () => {
          console.log('Appointment created successfully');
          onClose();
        },
        onError: (error) => {
          console.error('Failed to create appointment:', error.message);
        }
      });
    }
  };

  // Prepare initial data for the form, mapping from the appointment prop
  const initialFormData: Partial<AppointmentFormData> = appointment
    ? {
        patient: appointment.patient || null,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        title: appointment.title,
      }
    : {};

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"
                >
                  {isEditing ? 'Editar Cita' : 'Crear Nueva Cita'}
                </Dialog.Title>
                
                <AppointmentForm 
                  initialData={initialFormData}
                  onSubmit={handleFormSubmit} 
                  // onOpenNewPatientModal={() => console.log('Open new patient modal from modal')} // Placeholder
                />

                {submissionError && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    <p>Error: {submissionError.message}</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button" // Changed to type="button" to prevent form submission by default
                    className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit" // This button will now submit the form with id 'appointment-form-id'
                    form="appointment-form-id" // Links to the form in AppointmentForm.tsx
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? (isEditing ? 'Guardando...' : 'Creando...') 
                      : (isEditing ? 'Guardar Cambios' : 'Crear Cita')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AppointmentModal;

