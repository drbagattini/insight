"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
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
  rrule?: string | null; // RRULE para citas recurrentes
  // Add other fields like notes etc. as they are implemented
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
    updateAppointment, isUpdatingAppointment, updateAppointmentError,
    deleteAppointment, isDeletingAppointment, deleteAppointmentError
  } = useAppointmentMutations();
  
  // Estado para el modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single'); // 'single' o 'all'
  
  // Determinar si la cita es recurrente
  const isRecurring = !!appointment?.rrule;
  
  // Estado compuesto para mostrar errores de creación o actualización
  const isSubmitting = isCreatingAppointment || isUpdatingAppointment || isDeletingAppointment;
  const submissionError = createAppointmentError || updateAppointmentError || deleteAppointmentError;

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
  
  // Función para manejar eliminación de citas
  const handleDeleteAppointment = () => {
    if (!appointment?.id) return;
    
    deleteAppointment(
      {
        id: appointment.id,
        deleteAll: deleteMode === 'all'
      },
      {
        onSuccess: () => {
          console.log('Appointment deleted successfully');
          setShowDeleteConfirm(false);
          onClose();
        },
        onError: (error) => {
          console.error('Failed to delete appointment:', error.message);
          setShowDeleteConfirm(false);
        }
      }
    );
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
                  isEditing={isEditing}
                  // onOpenNewPatientModal={() => console.log('Open new patient modal from modal')} // Placeholder
                />

                {submissionError && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    <p>Error: {submissionError.message}</p>
                  </div>
                )}

                <div className="mt-6 flex justify-between w-full">
                  {isEditing && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-red-700 dark:bg-transparent dark:text-red-500 dark:hover:bg-red-900/30"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Eliminar
                    </button>
                  )}
                  
                  <div className={`flex space-x-3 ${isEditing ? 'ml-auto' : ''}`}>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="appointment-form-id"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting 
                        ? (isEditing ? 'Guardando...' : 'Creando...') 
                        : (isEditing ? 'Guardar Cambios' : 'Crear Cita')}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      {/* Modal de confirmación para eliminar cita */}
      <Transition appear show={showDeleteConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => !isDeletingAppointment && setShowDeleteConfirm(false)}>
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50" />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Confirmar eliminación
                </Dialog.Title>

                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    ¿Estás seguro de que deseas eliminar esta cita?
                  </p>
                  
                  {/* Opciones de eliminación - solo visibles para citas recurrentes */}
                  {isRecurring && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Opciones de eliminación:</p>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="delete-single"
                          name="delete-mode"
                          checked={deleteMode === 'single'}
                          onChange={() => setDeleteMode('single')}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                        />
                        <label htmlFor="delete-single" className="block text-sm text-gray-700 dark:text-gray-300">
                          Solo esta cita
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="delete-all"
                          name="delete-mode"
                          checked={deleteMode === 'all'}
                          onChange={() => setDeleteMode('all')}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                        />
                        <label htmlFor="delete-all" className="block text-sm text-gray-700 dark:text-gray-300">
                          Todas las citas de esta serie
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeletingAppointment}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
                      onClick={handleDeleteAppointment}
                      disabled={isDeletingAppointment}
                    >
                      {isDeletingAppointment ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Transition>
  );
};

export default AppointmentModal;

